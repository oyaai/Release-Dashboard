const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const multer = require('multer');

const connectDB = require("./db_mongo");
const InfoGate = require("./models/InfoGate");

const app = express();
const logFilePath = path.join(__dirname, "submit.log")


connectDB();

app.set("view engine", "ejs");
//app.use(express.static("views"));
app.use(express.static(path.join(__dirname, "views")));
app.use(bodyParser.urlencoded({ extended: false}));

const storage = multer.memoryStorage();
const upload = multer({ storage });

const port = 5432;

const cpUpload = upload.fields([
  { name: "uploadfileUAT", maxCount: 1},
  { name: "fileuploadIVT", maxCount: 10 }
])


app.get("/", (req, res)=>{
    res.render("index", { message: message.home });
});


const moment = require("moment"); 

app.get("/release", async (req, res) => {
    try {
      const filterMonth = req.query.month; // รับพารามิเตอร์เดือนจาก URL
      const allRecords = await InfoGate.find().sort({ deploymentDate: -1 }).lean();
      //const records = await InfoGate.find().sort({ deploymentDate: -1 }).lean();

      const groupedRecords = {};
      allRecords.forEach((record) => {
        const month = moment(record.deploymentDate).format("YYYY-MM");
        if (!groupedRecords[month]) groupedRecords[month] = [];
        groupedRecords[month].push(record);
      });

      let displayedRecords = groupedRecords;
      if (filterMonth) {
        displayedRecords = {
          [filterMonth]: groupedRecords[filterMonth] || [],
        };
      }

      res.render("release", {
        groupedRecords: displayedRecords,
        selectedMonth: filterMonth || "",
       });
    } catch (error) {
      console.error("Error fetching release records: ", error);
      res.status(500).send("Cannot load Data");
    }
});

app.get("/search", (req, res) => {
    res.render("search", { title: "Search" });
});


app.post("/delete/:id", async (req, res) => {
  try {
    await InfoGate.findByIdAndDelete(req.params.id);
    writelog(`ลบข้อมูล ID: ${req.params.id}`);
    res.redirect("/release");
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).send("ไม่สามารถลบข้อมูลได้");
  }
});


app.get("/update/:id", async (req, res) => {
  try {
    const record = await InfoGate.findById(req.params.id).lean();
    if (!record) {
      return res.status(404).send("ไม่พบข้อมูลโปรเจกต์ที่ต้องการอัปเดต");
    }
    res.render("update", { record });
  } catch (err) {
    console.error("Error fetching record for update:", err);
    res.status(500).send("เกิดข้อผิดพลาดในการโหลดข้อมูล");
  }
});

app.post("/update/:id", cpUpload, async (req, res) => {
  const { 
    projectName, 
    deploymentDate, 
    txtcomponents, 
    uatResult, 
    projectManager, 
    saOwner 
  } = req.body;

  const contactPoints = Array.isArray(req.body.txtContactPoint)
    ? req.body.txtContactPoint
    : [req.body.txtContactPoint];

  const credentialEmails = contactPoints.map((email) => ({ email }));

  const updateData = {
    projectName,
    deploymentDate,
    txtcomponents,
    uatResult,
    projectManager,
    saOwner,
    credentialEmails,
  };

  if (req.files.uploadfileUAT?.[0]) {
    updateData.uatResultFile = req.files.uploadfileUAT[0].buffer.toString("base64");
  }

  if (req.files.fileuploadIVT) {
    updateData.ivtFiles = req.files.fileuploadIVT.map(file => ({
      fileBase64: file.buffer.toString("base64"),
    }));
  }

  try {
    await InfoGate.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/release");
  } catch (err) {
    console.error("Error updating record:", err);
    res.status(500).render("pop-up", {
      message: "ไม่สามารถอัปเดตข้อมูลได้",
      redirectUrl: "/release"
    });
  }
});


////////////// Start Test Connection /////////////
/* async function testQuery() {
  try {
    const result = await db.query('SELECT NOW()');
    console.log(result.rows);
  } catch (err) {
    console.error('Database error:', err);
  }
}
testQuery(); */
////////////// End Test Connection /////////////

function writelog(message){
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}\n`;

  console.log("Writing log:", fullMessage);

  fs.appendFile(logFilePath, fullMessage, (err) => {
    if(err) console.error("ไม่สามารถเขียน log ได้!!", err);
  });
}

app.post("/submit", cpUpload, async (req, res) => {
    const { 
      projectName, 
      deploymentDate, 
      txtcomponents, 
      uatResult, 
      projectManager, 
      saOwner, } = req.body;
      console.log(" Files: ", req.files);
      const file = req.files.uploadfileUAT?.[0];

      if (!file) {
        return res.status(400).send(" Can't get files UAT");
      }
    
    const contactPoints = Array.isArray(req.body.txtContactPoint)
      ? req.body.txtContactPoint
      : [req.body.txtContactPoint];

    const uatResultFile = req.files.uploadfileUAT?.[0]
      ? req.files.uploadfileUAT[0].buffer.toString('base64')
      : null;
    
    const ivtFiles = req.files.fileuploadIVT?.map((file) =>
      ({ fileBase64: file.buffer.toString('base64'), })) || [];

    const credentialEmails = contactPoints.map((email) => ({ email }));
    
    try {
        const newRecord = new InfoGate({
          projectName,
          deploymentDate,
          txtcomponents,
          uatResult,
          uatResultFile,
          projectManager,
          saOwner,
          ivtFiles,
          credentialEmails,
        });
        
        await newRecord.save();

        const logMsg = `บันทึกสำเร็จ : ${projectName}`;
        writelog(logMsg);
        writelog("========");
        //console.log("ข้อมูลถูกบันทึก:", result.rows[0]);
        console.log("Submit information : ", req.body);
        //return res.render("release", { title: `บันทึกข้อมูลเรียบร้อย: ${projectName}` });
        res.redirect("/release")

    } catch (error) {
        const errMsg = `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`;
        //res.status(500).send("ไม่สามารถบันทึกข้อมูลได้");
        
        writelog(errMsg);
        writelog("========");
        console.error("Submit error: ", error);
        //console.error(errMsg);
        res.status(500).render("pop-up", {
            message: "ไม่สามารถบันทึกข้อมูลได้",
            redirectUrl: "/"
        });
    }
});


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});