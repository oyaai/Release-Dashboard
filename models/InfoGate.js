const mongoose = require("mongoose");

const infoGateSchema = new mongoose.Schema(
  {
    projectName: String,
    deploymentDate: Date,
    txtcomponents: String,
    uatResult: String,
    uatResultFile: String, // base64 string
    projectManager: String,
    saOwner: String,

    ivtFiles: [
      {
        fileBase64: String,
      },
    ],

    credentialEmails: [
      {
        email: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("InfoGate", infoGateSchema);
