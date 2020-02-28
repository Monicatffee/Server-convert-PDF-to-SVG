const PORT = process.env.PORT || 3000;
const express = require('express');
var fs = require('fs');
//var util = require('util');
//var path = require('path');
///var stream = require('stream');
const app = express();
const path = require('path');
const multer = require('multer');
var pdfjsLib = require('pdfjs-dist');


let storage = multer.diskStorage({
    destination:(req, file, cb)=>{
        cb(null, './filePDF')
    },
    filename:(req, file, cb)=>{
        cb(null, file.fieldname + '-'+ Date.now()+ path.extname(file.originalname))
    }
});

const upload = multer ({storage})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res)=> {
    return res.send('This in my page');
});

app.post('/load', upload.single('file'), (req, res) => {
    var pdfPath = req.file.path || './mapa.pdf';
    console.log('leer el pdf');
    var data = new Uint8Array(fs.readFileSync(pdfPath));
    console.log(`Storage location is ${req.hostname}/${req.file.path}`);
    
    pdfjsLib.getDocument({
        data: data,
        nativeImageDecoderSupport: pdfjsLib.NativeImageDecoding.DISPLAY
      }).then(function (doc) {
        var numPages = doc.numPages;
        console.log('# Document Loaded');
        console.log('Number of Pages: ' + numPages);
        console.log();
          return doc.getPage(pageNum).then(function (page) {
            console.log('# Page ' + pageNum);
            var viewport = page.getViewport(1.0 /* scale */);
            console.log('Size: ' + viewport.width + 'x' + viewport.height);
            console.log();
       
            page.getOperatorList().then(function (opList) {
              var svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs);
              svgGfx.embedFonts = true;
              svgGfx.getSVG(opList, viewport).then(function (svg) {
                var svg = writeSvgToFile(svg, getFilePathForPage(pageNum)).then(function () {
                  console.log('Page: ' + pageNum);
                }, function(err) {
                  console.log('Error: ' + err);
                });
              });
            });
          });

    //return res.send(req.file) 
    });
    return svg;
});


app.listen(PORT, () => console.log(`Server is up on port: ${PORT}`));






const PORT = process.env.PORT || 3000;
const express = require('express');
//const PDFJS = pdfjsLib;
const app = express();

const path = require('path');
const multer = require('multer');

let storage = multer.diskStorage({
    destination:(req, file, cb)=>{
        cb(null, './filePDF')
    },
    filename:(req, file, cb)=>{
        cb(null, file.fieldname + '-'+ Date.now()+ path.extname(file.originalname))
    }
});

const upload = multer ({storage})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res)=> {
    return res.send('This in my page');
});

app.post('/load', upload.single('file'), (req, res) => {
    console.log(`Storage location is ${req.hostname}/${req.file.path}`);
    return res.send(req.file)
});




app.listen(PORT, () => console.log(`Server is up on port: ${PORT}`))