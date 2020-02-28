const PORT = process.env.PORT || 3000;
const express = require('express');
var fs = require('fs');
var util = require('util');
var stream = require('stream');
const app = express();
const path = require('path');
const multer = require('multer');
var pdfjsLib = require('pdfjs-dist');
var outputDirectory = './filePDF';
require('./domstubs.js').setStubs(global);


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
    
    function ReadableSVGStream(options) {
        if (!(this instanceof ReadableSVGStream)) {
          return new ReadableSVGStream(options);
        }
        stream.Readable.call(this, options);
        this.serializer = options.svgElement.getSerializer();
      }
      util.inherits(ReadableSVGStream, stream.Readable);
      ReadableSVGStream.prototype._read = function() {
        var chunk;
        while ((chunk = this.serializer.getNext()) !== null) {
          if (!this.push(chunk)) {
            return;
          }
        }
        this.push(null);
      };
    
      function getFilePathForPage(pageNum) {
        var name = path.basename(pdfPath, path.extname(pdfPath));
        return path.join(outputDirectory, name + '-' + pageNum + '.svg');
      }

      function writeSvgToFile(svgElement, filePath) {
        var readableSvgStream = new ReadableSVGStream({
          svgElement: svgElement,
        });
        var writableStream = fs.createWriteStream(filePath);
        return new Promise(function(resolve, reject) {
          readableSvgStream.once('error', reject);
          writableStream.once('error', reject);
          writableStream.once('finish', resolve);
          readableSvgStream.pipe(writableStream);
        }).catch(function(err) {
          readableSvgStream = null; // Explicitly null because of v8 bug 6512.
          writableStream.end();
          throw err;
        });
      }

    pdfjsLib.getDocument({
        data: data,
        nativeImageDecoderSupport: pdfjsLib.NativeImageDecoding.DISPLAY
      }).then(function (doc) {
        var numPages = doc.numPages;
        console.log('# Document Loaded');
        console.log('Number of Pages: ' + numPages);
        console.log();
          return doc.getPage(numPages).then(function (page) {
            console.log('# Page ' + numPages);
            var viewport = page.getViewport(1.0 /* scale */);
            console.log('Size: ' + viewport.width + 'x' + viewport.height);
            console.log();
       
            page.getOperatorList().then(function (opList) {
              var svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs);
              console.log('svgGfx.')
              svgGfx.embedFonts = true;
              svgGfx.getSVG(opList, viewport).then(function (svg) {
                var a = getFilePathForPage(numPages);
                var svgF = writeSvgToFile(svg, a) .then(function () {
                  console.log('Page: ' + numPages);
                  console.log(a);
                  res.sendFile(a, {root:__dirname});
                }, function(err) {
                  console.log('Error: ' + err);
                });
              });
            });
          });
    });
});


app.listen(PORT, () => console.log(`Server is up on port: ${PORT}`));

