const express = require("express");

const app = express();

app.use(express.json());

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

let database = null;

const initializeConnectionObjectDbToServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`Db Error: ${error.message}`);
    process.exit(1);
  }
};

initializeConnectionObjectDbToServer();

const convertStateObjToResponseObj = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictObjToResponseObj = (districtObj) => {
  return {
    districtId: districtObj.district_id,
    districtName: districtObj.district_name,
    stateId: districtObj.state_id,
    cases: districtObj.cases,
    cured: districtObj.cured,
    active: districtObj.active,
    deaths: districtObj.deaths,
  };
};

//Returns a list of all states in the state table

app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
            SELECT
                *
            FROM
                state;`;
  const allStates = await database.all(getAllStatesQuery);
  response.send(
    allStates.map((eachState) => convertStateObjToResponseObj(eachState))
  );
});

//Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesQuery = `
            SELECT 
                *
            FROM
                state
            WHERE
                state_id = ${stateId};`;
  const states = await database.get(getStatesQuery);
  response.send(convertStateObjToResponseObj(states));
});

//Create a district in the district table, district_id is auto-incremented

app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const createNewDataQuery = `
        INSERT INTO
            district (state_id, district_name, cases, cured, active, deaths)
        VALUES(
             ${stateId},
            '${districtName}',
             ${cases},
             ${cured},
             ${active},
             ${deaths});`;

  await database.run(createNewDataQuery);
  response.send(`District Successfully Added`);
});

//Returns a district based on the district ID

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
            SELECT 
                *
            FROM
                district
            WHERE
                district_id = ${districtId};`;
  const district = await database.get(getDistrictQuery);
  response.send(convertDistrictObjToResponseObj(district));
});

//Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM
            district
        WHERE
            district_id = ${districtId};`;

  await database.run(deleteDistrictQuery);
  response.send(`District Removed`);
});

//Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
  UPDATE 
    district
  SET
    district_name ='${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};`;

  await database.run(updateDistrictQuery);
  response.send(`District Details Updated`);
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalCasesDetailsQuery = `
    SELECT
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM
        district
    WHERE 
        state_id = ${stateId};`;
  const stats = await database.get(getTotalCasesDetailsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//Returns an object containing the state name of a district based on the district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictNameQuery = `
    SELECT 
        state_name
    FROM
        state
    NATURAL JOIN
        district
    WHERE
        district_id = ${districtId};`;
  const stateName = await database.get(getDistrictNameQuery);
  response.send({
    stateName: stateName.state_name,
  });
});

module.exports = app;
