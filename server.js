// PASTE THIS IN CLOUDFLARE WORKERS:
const GITHUB_CLIENT_ID = "...";
const GITHUB_CLIENT_SECRET = "...";
const TURSO_URL = "...";
const TURSO_TOKEN = "........";
const X_DEVH_API_KEY = ".";
const ALLOWED_ORIGINS = ["https://draw.devh.in"];

// Helper to interact with Turso via raw HTTP
async function dbQuery(sql, args = []) {
  const body = {
    requests: [
      {
        type: "execute",
        stmt: {
          sql,
          args: args.map(a => {
            if (typeof a === 'number') return { type: 'float', value: a };
            if (a === null) return { type: 'null' };
            return { type: 'text', value: String(a) };
          })
        }
      },
      { type: "close" }
    ]
  };

  const res = await fetch(TURSO_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TURSO_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  const execResult = json.results[0];
  
  if (execResult.type === "error") {
    throw new Error(execResult.error.message);
  }

  const { cols, rows } = execResult.response.result;
  
  return rows.map(row => {
    const obj = {};
    cols.forEach((col, i) => {
      obj[col.name] = row[i].value;
    });
    return obj;
  });
}

async function getUserFromReq(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const sessionId = authHeader.split(" ")[1];
  
  const sessions = await dbQuery(`SELECT user_id FROM sessions WHERE id = ? LIMIT 1`, [sessionId]);
  if (sessions.length === 0) return null;
  return sessions[0].user_id;
}

async function processBase64Images(data) {
  // FIX: Changed from data.data.files to data.files
  if (!data || !data.files) return;

  const files = data.files;
  for (const [fileId, fileObj] of Object.entries(files)) {
    if (fileObj.dataURL && fileObj.dataURL.startsWith("data:image/")) {
      const base64Str = fileObj.dataURL.split(',')[1];
      if (!base64Str) continue;

      // 1MB limit check
      const padding = (base64Str.match(/=+$/) || [''])[0].length;
      const sizeInBytes = (base64Str.length * 3) / 4 - padding;
      
      if (sizeInBytes > 1048576) {
        throw new Error(`Image ${fileId} exceeds 1MB limit.`);
      }

      // Convert base64 to binary
      const byteString = atob(base64Str);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      const mimeType = fileObj.mimeType || 'image/png';
      const blob = new Blob([uint8Array], { type: mimeType });
      const ext = mimeType.split('/')[1] || 'png';

      // Upload to external server
      try {
        await fetch('https://x.devh.in/api/tools/file', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${X_DEVH_API_KEY}`,
            'x-filename': `${fileId}.${ext}`,
            'x-slug': fileId
          },
          body: blob
        });
      } catch (e) {
        console.error("Upload failed, but continuing to swap URL", e);
      }

      // Swap out the base64 for the URL
      fileObj.dataURL = `https://x.devh.in/f/${fileId}`;
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // --- CORS SETUP ---
    const origin = request.headers.get("Origin");
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Credentials": "true"
    };

    // Helper to return responses with CORS
    const respond = (body, status = 200, contentType = "application/json") => {
      return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": contentType }
      });
    };

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      if (path === "/auth/signin" && method === "GET") {
        const originParam = url.searchParams.get("origin");
        if (!originParam) return respond({ error: "Missing origin" }, 400);

        const state = encodeURIComponent(originParam);
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email&state=${state}`;
        
        // Redirects don't need CORS headers as they change the top-level window location
        return Response.redirect(githubAuthUrl, 302);
      }

      if (path === "/auth/success" && method === "GET") {
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state"); 
        if (!code || !state) return respond({ error: "Missing code/state" }, 400);

        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code })
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) return respond({ error: "GitHub Auth Failed" }, 400);

        const userRes = await fetch("https://api.github.com/user", {
          headers: { "Authorization": `Bearer ${tokenData.access_token}`, "User-Agent": "Cloudflare-Worker" }
        });
        const userData = await userRes.json();

        const emailRes = await fetch("https://api.github.com/user/emails", {
          headers: { "Authorization": `Bearer ${tokenData.access_token}`, "User-Agent": "Cloudflare-Worker" }
        });
        const emailData = await emailRes.json();
        const primaryEmail = emailData.find(e => e.primary)?.email || emailData[0]?.email;

        const userId = `github_${userData.id}`;
        await dbQuery(
          `INSERT INTO users (id, email, name) VALUES (?, ?, ?) 
           ON CONFLICT(email) DO UPDATE SET name=excluded.name, id=excluded.id`, 
          [userId, primaryEmail, userData.name || userData.login]
        );

        const sessionId = crypto.randomUUID();
        await dbQuery(
          `INSERT INTO sessions (id, user_id, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?)`, 
          [sessionId, userId, request.headers.get("CF-Connecting-IP") || "", request.headers.get("User-Agent") || "", Date.now()]
        );

        return Response.redirect(`${decodeURIComponent(state)}/callback?token=${sessionId}`, 302);
      }

      if (path === "/auth/signout" && method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (authHeader?.startsWith("Bearer ")) {
          await dbQuery(`DELETE FROM sessions WHERE id = ?`, [authHeader.split(" ")[1]]);
        }
        return respond({ message: "Logged out" });
      }

      // PROTECTED ROUTES
      const userId = await getUserFromReq(request);
      if (!userId && path.match(/^\/(read|write)/)) {
        return respond({ error: "Unauthorized" }, 401);
      }

      if (path === "/read/projects" && method === "GET") {
        // Fetch only the metadata columns
        const projects = await dbQuery(
          `SELECT id, slug, title, last_edited_ts FROM projects WHERE user_id = ? ORDER BY last_edited_ts DESC`, 
          [userId]
        );
        
        return respond(projects);
      }

      if (path.startsWith("/read/project/") && method === "GET") {
        const projectId = path.split("/").pop();
        const projects = await dbQuery(`SELECT * FROM projects WHERE id = ? AND user_id = ?`, [projectId, userId]);
        if (projects.length === 0) return respond({ error: "Not found" }, 404);
        return respond(projects[0]);
      }

      if (path.startsWith("/write/project/") && method === "POST") {
        const projectId = path.split("/").pop();
        const body = await request.json();
        const { data, last_edited_ts, slug, title } = body;
        
        if (!data || !last_edited_ts) {
          return respond({ error: "Missing data or last_edited_ts" }, 400);
        }

        // Check project count limits for new projects
        const existingProject = await dbQuery(`SELECT id FROM projects WHERE id = ? AND user_id = ?`, [projectId, userId]);
        if (existingProject.length === 0) {
          const countRes = await dbQuery(`SELECT COUNT(id) as c FROM projects WHERE user_id = ?`, [userId]);
          if (countRes[0].c >= 30) {
            return respond({ error: "Project limit reached (Max 30 projects)" }, 403);
          }
        }

        // Upload images to external server and swap base64 for URLs
        try {
          await processBase64Images(data);
        } catch (err) {
          return respond({ error: err.message }, 400);
        }

        const stringifiedData = JSON.stringify(data);

        // Max project size validation (500KB)
        if (new Blob([stringifiedData]).size > 512000) {
          return respond({ error: "Project exceeds 500KB limit" }, 400);
        }

        // Insert or Update including the new slug and title columns
        await dbQuery(`
          INSERT INTO projects (id, user_id, data, slug, title, last_edited_ts) 
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET 
            data = excluded.data, 
            slug = excluded.slug,
            title = excluded.title,
            last_edited_ts = excluded.last_edited_ts 
          WHERE projects.user_id = excluded.user_id 
            AND excluded.last_edited_ts > projects.last_edited_ts
        `, [projectId, userId, stringifiedData, slug || null, title || null, last_edited_ts]);

        // Return the metadata of the saved project
        return respond({
          id: projectId,
          slug: slug,
          title: title,
          last_edited_ts: last_edited_ts
        });
      }

      if (path.startsWith("/write/delete/") && method === "DELETE") {
        const projectId = path.split("/").pop();
        await dbQuery(`DELETE FROM projects WHERE id = ? AND user_id = ?`, [projectId, userId]);
        return respond({ message: "Deleted" });
      }
      // Public Share Link - No Auth Required
      if (path.startsWith("/share/f/") && method === "GET") {
        const slug = path.split("/").pop();
        const res = await fetch(`https://x.devh.in/f/${slug}`);
        if (!res.ok) return respond({ error: "Shared project not found" }, 404);
        const data = await res.json();
        return respond(data);
      }
      if (path.startsWith("/share/") && method === "POST") {
        const projectId = path.split("/").pop();
        
        // 1. Get the project data from DB
        const projects = await dbQuery(
          `SELECT data FROM projects WHERE id = ? AND user_id = ?`, 
          [projectId, userId]
        );
        
        if (projects.length === 0) return respond({ error: "Project not found" }, 404);

        // 2. Generate a random slug for the share link
        const shareSlug = "s_" + crypto.randomUUID().split('-')[0];
        
        // 3. Upload the JSON data to the external server
        const blob = new Blob([projects[0].data], { type: 'application/json' });
        const uploadRes = await fetch('https://x.devh.in/api/tools/file', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${X_DEVH_API_KEY}`,
            'x-filename': `${shareSlug}.json`,
            'x-slug': shareSlug
          },
          body: blob
        });

        if (!uploadRes.ok) return respond({ error: "Failed to generate share link" }, 500);

        // 4. Return the new share URL
        return respond({ 
          shareUrl: `https://draw.devh.in/share/${shareSlug}`, // Your frontend URL
          fileUrl: `https://x.devh.in/f/${shareSlug}`,        // The raw data URL
          slug: shareSlug 
        });
      }

      return respond({ error: "Not Found" }, 404);

    } catch (err) {
      // Critical: Even errors must return CORS headers
      return respond({ error: err.message }, 500);
    }
  }
};