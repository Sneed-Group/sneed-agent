import { Ollama } from "@langchain/ollama";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import * as path from 'path'
import http from 'http';
import { URL } from 'url';
const debugMode = false
const __dirname = path.resolve();

function llamaLoader(model="sparksammy/samantha-3.1", url="http://localhost:11434") {
  return new Ollama({
    baseUrl: url, // Default value
    model: model, // Default value
  });
}

const ollama = llamaLoader()



async function loadDoc(www) {
  try {
    const loader = new PuppeteerWebBaseLoader(String(www), {
      launchOptions: {
        headless: true,
      },
      gotoOptions: {
        waitUntil: "domcontentloaded",
      },
    });
  
    const docs = await loader.load();
    return docs[0].pageContent;
  } catch {
    return ""
  }
}

async function getReply(q, www='docChatterThing.testfile.invalid') {
  let document
  let query
  if (www == "docChatterThing.testfile.invalid" || www == "") {
    document = "Chatting."
  } else {
    document = await loadDoc(www)
  }
  
  query = String(`Context: ${document} Query: ${q}`)
  
  if (debugMode) {
    console.log(query) //Debug feature that prints out the user's query.
  }
  
  const stream = await ollama.stream(
    query    
  );
      
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
      
  return chunks.join(""); 
} 


async function main(port) {
  const hostname = '127.0.0.1';

  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust as needed
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.statusCode = 200;
    
    // Create URL object and parse query parameters
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const queryParams = urlObj.searchParams;

    // Get query parameters with default values if not provided
    const q = queryParams.get('q') || "Create an error 500 message explaining that the user didn't input a query and optionally a URL.";
    const www = queryParams.get('www') || "docChatterThing.testfile.invalid";

    // Get reply and send response
    getReply(q, www).then(answer => {
      res.setHeader('Content-Type', 'text/plain');
      res.end(String(answer));
    }).catch(err => {
      res.statusCode = 500;
      res.end(`Internal Server Error: ${err.message}`);
    });
  });

  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

main(8543)
