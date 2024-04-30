import readline from 'readline';
import Ollama from 'ollama-js-client';
import fs from 'fs';

let DEBUG_MODE = true

async function ollamaInteraction() {
  const rl = await readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function extractFunctionName(response) {
    const match = response.match(/<functioncall>([^<]+)<\/functioncall>/);
    return match ? match[1] : '';
  }


  function generateRandomString(length = 16) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  //INTERNAL FUNCTIONS MAGIC BEGIN
  async function jitsi() {
    const id = generateRandomString()
    const jitsiURL = `https://meet.jit.si/${id}`;
    console.log(jitsiURL);
    return jitsiURL;
  }

  async function search(q) {
    q = q.replaceAll(" ", "+")
    const searchURL = `https://www.google.com/search?q=${q}&sca_upv=1`
    console.log(searchURL);
    return searchURL;
  }
  //END OF INTERNAL FUNCTIONS MAGIC

  return new Promise(async (resolve) => {
    rl.question("User: ", async (userInput) => {
      rl.close();

      const ollama = new Ollama({
        model: "sneedgroup-llama3-agent",
        url: "http://127.0.0.1:11434/api/",
      }); // Ensure the model name is correct

      const responsePreParse = await ollama.prompt(userInput)
      const response = responsePreParse.response;
      const functionName = extractFunctionName(response);
      const responseWithoutFunctionCall = response.replace(/<functioncall>.*?<\/functioncall>/, '');

      console.log(responseWithoutFunctionCall);

      let contentToAppend = `<USER>: ${userInput}
                         
                          <AI AGENT>: ${responseWithoutFunctionCall}`;

      await fs.appendFile('journal.txt', contentToAppend, async (err) => {
        if (err) {
          await console.error(err);
        } else {
          await console.log('Content appended to journal file successfully!');
        }
      });

      if (DEBUG_MODE) {
        console.log(`DEBUG: RUN ${functionName}`)
      }

      eval(function() {
        if (typeof functionName == 'undefined' || functionName == null) {
          return "";
        } else {
          return functionName;
        }
      })

      resolve(); // Resolve the promise after processing
    });
  });
}

(async () => {
  while (true) {
    try {
      await ollamaInteraction();
    } catch (error) {
      console.error('Error occurred:', error);
    }
  }
})();
