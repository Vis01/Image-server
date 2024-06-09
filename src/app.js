import  express  from "express";
import cors from "cors"
import cookieParser from "cookie-parser"
import axios from 'axios';
import cheerio from 'cheerio';
import Tesseract from 'tesseract.js';
import Menu from './models/Menu.js';
import sharp from 'sharp';

const app=express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    Credential:true
}))
app.use(express.json())
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser( ))

// routes
import userRouter from "./routes/user.routes.js"
 
//routes declaration
// app.use("/api/v1/users ",userRouter);
app.use("/user",userRouter);
app.get("/",(req,res)=>{
    res.send("hello")

})
app.post('/scrape', async (req, res) => {
    const { url } = req.body;
  
    try {
      // Scrape images from the website with headers
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        },
      });
      const $ = cheerio.load(response.data);
      const imageUrls = $('img').map((i, el) => $(el).attr('src')).get();
  
      let menuItems = [];
  
      for (let imageUrl of imageUrls) {
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(imageResponse.data, 'binary');
  
        // Pre-process image using sharp
        const processedImage = await sharp(buffer)
          .greyscale()
          .normalize()
          .toBuffer();
  
        // Perform OCR on the processed image
        const { data: { text } } = await Tesseract.recognize(processedImage);
  
        // Process OCR text to extract items and prices
        const items = processText(text);
        menuItems = [...menuItems, ...items];
      }
  
      // Save to MongoDB using Mongoose
      const menu = new Menu({ url, menuItems });
      await menu.save();
  
      res.json({ status: 'success', menuItems });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', error: error.message });
    }
  });
  
  function processText(text) {
    // Split text into lines
  const lines = text.split('\n');

  // Define regular expressions to match menu items and prices
  const itemRegex = /[a-zA-Z\s]+/;
  const priceRegex = /[0-9]+\.[0-9]{2}/;

  let menuItems = [];

  // Iterate through each line of text
  for (let line of lines) {
    // Match the item and price using regular expressions
    const itemMatch = line.match(itemRegex);
    const priceMatch = line.match(priceRegex);

    // If both item and price are found, add them to the menuItems array
    if (itemMatch && priceMatch) {
      const item = itemMatch[0].trim();
      const price = parseFloat(priceMatch[0]);
      menuItems.push({ item, price });
    }
  }

  return menuItems;
  }
//htttp://localhost:8000/users/register


export {app} ;