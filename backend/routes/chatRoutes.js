const express = require("express");
//Node.js looks into your node_modules folder for a package named express.

// It loads the main export of that package (as defined in express’s package.json → "main": "index.js").

// That export is actually a function — the Express application factory.
const { handleChat } = require("../controllers/chatController"); //imports handleChat function from chatController

const router = express.Router();

router.post("/", handleChat); //Posts the server request to controllers/chatController

module.exports = router; //every file is a module in node.js
// exporting makes the exported object available for all the files that "require" it.
