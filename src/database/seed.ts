const client = require("./client")

// insert collections

// locations C_WW
    // insert location (if not exists)

    // insert location_collection

// The insert statement
const query = "INSERT INTO collection (collect_name_en, collect_name_en, collect_group_en, collect_group_de, collect_info_en, collect_info_de) VALUES ($1, $2, $3, $4, $5, $6)"

// Connect to the db instance
client.connect((err: any, client: any, done: any) => {
    if (err) throw err;
    try {
        // For each line we run the insert query with the row providing the column values
        client.query(query, ["Worldwide","Weltweit","Cities","Städte","Large cities all over the world", "Große Städte in aller Welt"], (err: any, res: any) => {
            if (err) {
                // We can just console.log any errors
                console.log(err.stack);
            } else {
                console.log("response", res, ["aKey2", "aLang2", "aContent2"])
                //console.log('inserted ' + res.rowCount + ' row:', ["aKey", "aLang", "aContent"]);
            }
        });
    } finally {
        done();
    }
});