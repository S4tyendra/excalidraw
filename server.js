// PASTE THIS IN CLOUDFLARE WORKERS:
const GITHUB_CLIENT_ID = "...";
const GITHUB_CLIENT_SECRET = "...";
const TURSO_URL = "...";
const TURSO_TOKEN = "...";
const X_DEVH_API_KEY = "...";

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

// Helper to validate session
async function getUserFromReq(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const sessionId = authHeader.split(" ")[1];
  
  const sessions = await dbQuery(`SELECT user_id FROM sessions WHERE id = ? LIMIT 1`, [sessionId]);
  if (sessions.length === 0) return null;
  return sessions[0].user_id;
}

// Process images to upload to external server and replace with URLs
async function processBase64Images(data) {
  if (!data || !data.data || !data.data.files) return;

  const files = data.data.files;
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
      await fetch('https://x.devh.in/api/tools/file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${X_DEVH_API_KEY}`,
          'x-filename': `${fileId}.${ext}`,
          'x-slug': fileId
        },
        body: blob
      });

      // Swap out the base64 for the URL regardless of upload success/failure (handles "Slug already exists")
      fileObj.dataURL = `https://x.devh.in/f/${fileId}`;
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (path === "/auth/signin" && method === "GET") {
        const origin = url.searchParams.get("origin");
        if (!origin) return new Response("Missing origin parameter", { status: 400 });

        const state = encodeURIComponent(origin);
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email&state=${state}`;
        
        return Response.redirect(githubAuthUrl, 302);
      }

      if (path === "/auth/success" && method === "GET") {
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state"); 
        
        if (!code || !state) return new Response("Missing code or state", { status: 400 });

        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code })
        });
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;
        if (!accessToken) return new Response("Failed to get token", { status: 400 });

        const userRes = await fetch("https://api.github.com/user", {
          headers: { "Authorization": `Bearer ${accessToken}`, "User-Agent": "Cloudflare-Worker" }
        });
        const userData = await userRes.json();

        const emailRes = await fetch("https://api.github.com/user/emails", {
          headers: { "Authorization": `Bearer ${accessToken}`, "User-Agent": "Cloudflare-Worker" }
        });
        const emailData = await emailRes.json();
        const primaryEmail = emailData.find(e => e.primary)?.email || emailData[0]?.email;
        if (!primaryEmail) return new Response("No email found on GitHub", { status: 400 });

        const userId = `github_${userData.id}`;
        const userName = userData.name || userData.login;

        await dbQuery(
          `INSERT INTO users (id, email, name) VALUES (?, ?, ?) 
           ON CONFLICT(email) DO UPDATE SET name=excluded.name, id=excluded.id`, 
          [userId, primaryEmail, userName]
        );

        const sessionId = crypto.randomUUID();
        const ip = request.headers.get("CF-Connecting-IP") || "";
        const ua = request.headers.get("User-Agent") || "";
        
        await dbQuery(
          `INSERT INTO sessions (id, user_id, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?)`, 
          [sessionId, userId, ip, ua, Date.now()]
        );

        const origin = decodeURIComponent(state);
        const redirectUrl = `${origin}/callback?token=${sessionId}`;
        
        return Response.redirect(redirectUrl, 302);
      }

      if (path === "/auth/signout" && method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const sessionId = authHeader.split(" ")[1];
          await dbQuery(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
        }
        return new Response(JSON.stringify({ message: "Logged out" }), { status: 200, headers: { "Content-Type": "application/json" }});
      }

      // ================================================================
      // PROTECTED ROUTES BELOW
      // ================================================================
      const userId = await getUserFromReq(request);
      if (!userId && path.match(/^\/(read|write)/)) {
        return new Response("Unauthorized", { status: 401 });
      }

      if (path === "/read/projects" && method === "GET") {
        const projects = await dbQuery(`SELECT data FROM projects WHERE user_id = ?`, [userId]);
        
        const metadata = projects.map(p => {
          try {
            const parsed = JSON.parse(p.data);
            if (parsed.data) {
              delete parsed.data.elements;
              delete parsed.data.files;
            }
            return parsed;
          } catch (e) {
            return null;
          }
        }).filter(Boolean);

        return new Response(JSON.stringify(metadata), { headers: { "Content-Type": "application/json" }});
      }

      if (path.startsWith("/read/project/") && method === "GET") {
        const projectId = path.split("/").pop();
        
        const projects = await dbQuery(`SELECT * FROM projects WHERE id = ? AND user_id = ?`, [projectId, userId]);
        if (projects.length === 0) return new Response("Project not found or access denied", { status: 404 });
        
        return new Response(JSON.stringify(projects[0]), { headers: { "Content-Type": "application/json" }});
      }

      if (path.startsWith("/write/project/") && method === "POST") {
        const projectId = path.split("/").pop();
        const body = await request.json();
        const { data, last_edited_ts } = body;
        
        if (!data || !last_edited_ts) return new Response("Missing data or last_edited_ts", { status: 400 });

        // Check project count limits before inserting new
        const existingProject = await dbQuery(`SELECT id FROM projects WHERE id = ? AND user_id = ?`, [projectId, userId]);
        if (existingProject.length === 0) {
          const countRes = await dbQuery(`SELECT COUNT(id) as c FROM projects WHERE user_id = ?`, [userId]);
          if (countRes[0].c >= 30) {
            return new Response("Project limit reached (Max 30 projects)", { status: 403 });
          }
        }

        // Upload images to external server and swap base64 for URLs
        try {
          await processBase64Images(data);
        } catch (err) {
          return new Response(err.message, { status: 400 });
        }

        const stringifiedData = JSON.stringify(data);

        // Max project size validation (500KB after image processing)
        if (new Blob([stringifiedData]).size > 512000) {
          return new Response("Project exceeds 500KB limit", { status: 400 });
        }

        await dbQuery(`
          INSERT INTO projects (id, user_id, data, last_edited_ts) 
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET 
            data = excluded.data, 
            last_edited_ts = excluded.last_edited_ts 
          WHERE projects.user_id = excluded.user_id 
            AND excluded.last_edited_ts > projects.last_edited_ts
        `, [projectId, userId, stringifiedData, last_edited_ts]);

        const updated = await dbQuery(`SELECT * FROM projects WHERE id = ? AND user_id = ?`, [projectId, userId]);
        return new Response(JSON.stringify(updated[0]), { headers: { "Content-Type": "application/json" }});
      }

      if (path.startsWith("/write/delete/") && method === "DELETE") {
        const projectId = path.split("/").pop();
        
        await dbQuery(`DELETE FROM projects WHERE id = ? AND user_id = ?`, [projectId, userId]);
        
        return new Response(JSON.stringify({ message: "Deleted successfully" }), { headers: { "Content-Type": "application/json" }});
      }

      return new Response("Not Found", { status: 404 });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      });
    }
  }
};