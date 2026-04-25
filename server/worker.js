// Clouflare > Workers&Pages > New worker > Edit code > Paste this:

// Add these to env vars:
// Create oauth app at https://github.com/settings/applications/new - set homepage url to your frontend url.
const GITHUB_CLIENT_ID = "";
const GITHUB_CLIENT_SECRET = "";
// GO to https://app.turso.tech/ an create new project and paste the url and paste details below, copy below turso sql and run it to create tables.
const TURSO_URL = "https://name.aws-region.turso.io/v2/pipeline";
const TURSO_TOKEN = "";
// Get this api key from x.devh.in:  
const X_DEVH_API_KEY = "";
// You knwo what to keep here.
const ALLOWED_ORIGINS = ["https://draw.devh.in"];

/* Turso.sql
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`email` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` numeric DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `fk_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
CREATE TABLE `projects` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`data` text,
	`slug` text,
	`title` text,
	`last_edited_ts` numeric DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `fk_projects_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
*/


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
  if (!data || !data.files) return;

  const files = data.files;
  for (const [fileId, fileObj] of Object.entries(files)) {
    if (fileObj.dataURL && fileObj.dataURL.startsWith("data:image/")) {
      const base64Str = fileObj.dataURL.split(',')[1];
      if (!base64Str) continue;

      const padding = (base64Str.match(/=+$/) || [''])[0].length;
      const sizeInBytes = (base64Str.length * 3) / 4 - padding;
      
      if (sizeInBytes > 1048576) {
        throw new Error(`Image ${fileId} exceeds 1MB limit.`);
      }

      const byteString = atob(base64Str);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      const mimeType = fileObj.mimeType || 'image/png';
      const blob = new Blob([uint8Array], { type: mimeType });
      const ext = mimeType.split('/')[1] || 'png';

      try {
        const res = await fetch('https://x.devh.in/api/tools/file', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${X_DEVH_API_KEY}`,
            'x-filename': `${fileId}.${ext}`,
            'x-slug': fileId
          },
          body: blob
        });

        if (!res.ok) {
          throw new Error(`Upload failed: ${res.status}`);
        }

        const data = await res.json();

        if (!data.success || !data.url) {
          throw new Error('Invalid API response');
        }

        fileObj.dataURL = data.url;

      } catch (e) {
        console.error('Upload failed, keeping original dataURL', e);
      }
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const origin = request.headers.get("Origin");
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Credentials": "true"
    };

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

      const userId = await getUserFromReq(request);
      if (!userId && path.match(/^\/(read|write)/)) {
        return respond({ error: "Unauthorized" }, 401);
      }

      if (path === "/read/projects" && method === "GET") {
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

        const existingProject = await dbQuery(`SELECT id FROM projects WHERE id = ? AND user_id = ?`, [projectId, userId]);
        if (existingProject.length === 0) {
          const countRes = await dbQuery(`SELECT COUNT(id) as c FROM projects WHERE user_id = ?`, [userId]);
          if (countRes[0].c >= 30) {
            return respond({ error: "Project limit reached (Max 30 projects)" }, 403);
          }
        }

        try {
          await processBase64Images(data);
        } catch (err) {
          return respond({ error: err.message }, 400);
        }

        const stringifiedData = JSON.stringify(data);

        if (new Blob([stringifiedData]).size > 512000) {
          return respond({ error: "Project exceeds 500KB limit" }, 400);
        }

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
      if (path.startsWith("/share/f/") && method === "GET") {
        const slug = path.split("/").pop();
        const res = await fetch(`https://x.devh.in/f/${slug}`);
        if (!res.ok) return respond({ error: "Shared project not found" }, 404);
        const data = await res.json();
        return respond(data);
      }
      if (path.startsWith("/share/") && method === "POST") {
        const projectId = path.split("/").pop();
        
        const projects = await dbQuery(
          `SELECT data FROM projects WHERE id = ? AND user_id = ?`, 
          [projectId, userId]
        );
        
        if (projects.length === 0) return respond({ error: "Project not found" }, 404);

        const shareSlug = "s_" + crypto.randomUUID().split('-')[0];
        
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

        return respond({ 
          shareUrl: `https://draw.devh.in/share/${shareSlug}`,
          fileUrl: `https://x.devh.in/f/${shareSlug}`,
          slug: shareSlug 
        });
      }

      return respond({ error: "Not Found" }, 404);

    } catch (err) {
      return respond({ error: err.message }, 500);
    }
  }
};
