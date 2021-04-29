var mysql = require("mysql");
const SibApiV3Sdk = require("sib-api-v3-sdk");
let axios = require("axios");
const csv2json = require("csvjson-csv2json");
let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey =
  "YOUR-API-KEY";

//connection with database
var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});


//get data needed for add task
exports.dataContact = (req, res) => {
  let recipientsType = req.params.recipientsType;
  let all = false;
  if (recipientsType === "all" || recipientsType === "nonClickers" || recipientsType === "nonOpeners" || recipientsType === "clickers" ||
    recipientsType === "openers" ||
    recipientsType === "softBounces" ||
    recipientsType === "hardBounces" ||
    recipientsType === "unsubscribed"
  ) {
    let apiInstance = new SibApiV3Sdk.EmailCampaignsApi();
    let apiProccess = new SibApiV3Sdk.ProcessApi();
    if (recipientsType === "all") {
      all = true;
    }
    let opts = {
      recipientExport: new SibApiV3Sdk.EmailExportRecipients(),
    };

    opts.recipientExport = {
      recipientsType: req.params.recipientsType,
    };

    apiInstance.emailExportRecipients(req.params.campaignId, opts).then((data) => {
        let dataFromSendingBlue = [];
        let index;
        var dateRaw = new Date().toISOString().slice(0, 20).split('T').join(' ').split('.')
        let todayDate = dateRaw[0];
        
        setTimeout(() => {
            apiProccess.getProcess(data.processId).then((response) => {
                axios.get(response.export_url).then(async (success) => {
                    const json = csv2json(success.data, {
                      parseNumbers: true,
                    });
                    await connection.query(" SELECT contact.*,customer.*,representative.firstname as representativeFirstName from contact JOIN customer ON customer.idCustomer=contact.customerid JOIN representative ON representative.representativecode = customer.representative ", (err, dataDb) => {
                      console.log("data successfully commed from database with " + dataDb.length + "rows.");
                      for (let j = 0; j < json.length; j++) {
                        if (dataDb.findIndex((x) => x.emailContact === json[j].Email_ID) >= 0) {
                          index = dataDb.findIndex((x) => x.emailContact === json[j].Email_ID);
                          console.log("email founded in database : " + dataDb[index].emailContact);
                          console.log(todayDate);
                          connection.query(`INSERT INTO hd_tache(type, statut, action, source, sujet,date_debut,date_creation, id_customer, id_contact, phone, commercial_code, commercial_name) VALUES ('Appel','Planifié','Tache','Campaigns','Découverte des besoins','${todayDate}','${todayDate}','${dataDb[index].customerid}','${dataDb[index].idContact}','${dataDb[index].phone}','${dataDb[index].representative}','${dataDb[index].representativeFirstName}')`, (err, insertedData) => console.log(insertedData));

                          dataFromSendingBlue.push(dataDb[index]);
                          if (j + 1 == json.length) {
                            res.json(dataFromSendingBlue);
                          }
                        } else {
                          connection.query(`INSERT INTO hd_tache(type, statut, action, source, sujet,date_debut,date_creation,commentaire) VALUES ('Appel','Planifié','Tache','Campaigns','Découverte des besoins','${todayDate}','${todayDate}','${json[j].Email_ID}')`, (err, insertedDataIgnored) => console.log(insertedDataIgnored));
                          console.log("email not founded in database :" + json[j].Email_ID);
                          res.send("email not founded in database and the task added")
                        }
                      }
                    });
                  })
                  .catch((err) => res.json(err));
              })
              .catch((err) => res.json(err));
          },
          all ? 20000 : 3000);
      })
      .catch((err) => res.json(err));
  } else {
    res.json({
      error: "please provide a valid recipientsType !",
    });
  }
};

