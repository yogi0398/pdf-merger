const express = require('express')
const path = require('path')
const cors = require('cors');
const multer = require('multer')
const fs = require('fs');
const PDFMerger = require('pdf-merger-js').default
const upload = multer({ dest: 'uploads/' })

const app = express()
const port = 3000

app.use(cors({
  origin: '*'
}));

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/upload', upload.array('pdf', 12), async (req, res) => {

  try {
    let merger = new PDFMerger();
    for (const file of req.files) {
      console.log(file);
      await merger.add(path.join(__dirname, file.path));
    }

    let d = new Date().getTime();
    let outputPath = `public/${d}merged.pdf`;
    await merger.save(outputPath);

    for (const file of req.files) {
      fs.unlink(path.join(__dirname, file.path), (error) => {
        if (error) {
          console.error("Error deleting file upload", error);
        }
      })
    }

    res.download(outputPath, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        res.status(500).send("Download failed");
      }
      fs.unlink(outputPath, (err) => {
        if (err) console.error("Error deleting merged file:", err);
      });
    });
  }
  catch (error) {
    console.error(err);
    res.status(500).send("Error merging PDFs");
  }
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Example app listening on port ${port}`)
})
