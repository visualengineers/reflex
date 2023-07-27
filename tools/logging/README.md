# ReFlex.Logging

Small node logging server using `express` and `winston` to log sensor data and result sets. Data sets can be stored as well.

## Start Logging Server

* start logging / data service with `npm run debug` (when debugging is necessary) or `npm run start`
* server runs at `http://localhost:4302`
* Test request can be found in `test/Insomnia/Insomnia_Workspace.json` for testing the REST_API with **Insomnia**

## Logging

* first create Log file with a POST-Request to `/log/create`
* as body, provide the header as message: `{ "message": "FrameId, IsValid, Comment;" }` writes `"FrameId, IsValid, Comment;` in the first line of the data.csv
* sensor data can be written in the same way by sending a POST request to `log/data` with the same body format (`{ "message": "1, true, testresult;" }` writes `1, true, testresult;` as line in the csv)
* results are written by sending a json string to `/log/result`. The body of the POST request is written as line in the result file without unmodified.
* logs are stored in `/data/log` in the format `%DATE%_data.csv` for tracking data and `%DATE%_result.json` for results.
* errors are logged in the same driectory as `%DATE%_error.log`

## Saving data sets

When generating data, these can be stored and retrieved in the data directory:

* save a data set in json format by sending a request to `/data/{id}` with `id` being the identifier for the data set.
* the json data provided in the body of the POST request is stored as `data_{id}` in the `data` directory
* to retrieve this data set, just send a GET request to `/data/{id}`
