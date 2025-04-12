import { readFile, writeFile } from "fs/promises";
import { createServer } from "http";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3002;
const DATA_FILE = path.join(__dirname, "data", "links.json");

const serveFile = async (res, filePath, contentType) => {
    try {
        const data = await readFile(filePath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    } catch (error) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 page not found");
    }
};

const loadLinks = async () => {
    try {
        const data = await readFile(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        if (error.code === "ENOENT") {
            await writeFile(DATA_FILE, JSON.stringify({}), "utf-8");
            return {};
        }
        throw error;
    }
};

const saveLinks = async (links) => {
    await writeFile(DATA_FILE, JSON.stringify(links, null, 2), "utf-8");
};

const server = createServer(async (req, res) => {
    console.log(req.method, req.url);

    if (req.method === "GET") {
        if (req.url === "/") {
            return serveFile(res, path.join(__dirname, "public", "index.html"), "text/html");
        } else if (req.url === "/style.css") {
            return serveFile(res, path.join(__dirname, "public", "style.css"), "text/css");
        } else if (req.url === "/app.js") {
            return serveFile(res, path.join(__dirname, "public", "app.js"), "text/javascript");
        } else if (req.url.startsWith("/s/")) {
            const links = await loadLinks();
            const shortCode = req.url.split("/s/")[1];

            if (links[shortCode]) {
                res.writeHead(302, { Location: links[shortCode] });
                return res.end();
            } else {
                res.writeHead(404, { "Content-Type": "text/plain" });
                return res.end("Shortened URL not found");
            }
        }
    }

    if (req.method === "POST" && req.url === "/shorten") {
        const links = await loadLinks();
        let body = "";

        req.on("data", chunk => body += chunk);
        req.on("end", async () => {
            const { url, shortCode } = JSON.parse(body);

            if (!url) {
                res.writeHead(400, { "Content-Type": "text/plain" });
                return res.end("URL is required");
            }

            const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

            if (links[finalShortCode]) {
                res.writeHead(400, { "Content-Type": "text/plain" });
                return res.end("Short code already exists. Please choose another.");
            }

            links[finalShortCode] = url;
            await saveLinks(links);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, shortCode: finalShortCode }));
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
