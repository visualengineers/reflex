# ReFlex.Logging

Small node logging server using `express` and `winston` to log sensor data and result sets. Data sets can be stored as well.

<!-- omit in toc -->
## Table of Contents

1. [Start Logging Server](#start-logging-server)
2. [REST API](#rest-api)
3. [Logging](#logging)
4. [Query Logs](#query-logs)
5. [Saving data sets](#saving-data-sets)

## Start Logging Server

* start logging / data service with `npm run debug` (when debugging is necessary) or `npm run start`
* server runs at `http://localhost:4302`
* Test request can be found in `test/Insomnia/Insomnia_Workspace.json` for testing the REST_API with **Insomnia**

__[⬆ back to top](#table-of-contents)__

## REST API

| endpoint                           | Method   | Description                        | Example Request Body                                                              | Example Response Body                                                             |
| ---------------------------------- | -------- | ---------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/log/create`                      | **POST** | create log file / start logging    | `{ "message": "FrameId, IsValid, Comment;" }`                                     | `{ "file": "2023-07-27T205105.042Z" }`                                            |
| `/log/data`                        | **POST** | log message to file                | `{ "message": "2, false, +++;" }`                                                 |                                                                                   |
| `/log/data/2023-07-27T205105.042Z` | **GET**  | retireve data logs                 | `FrameId, IsValid, Comment;`<br/>`2, false, +++;`                                 |                                                                                   |
| `/log/result`                      | **POST** | log result to file                 | `{ "ProbandId": 3, "test": true, "result": "result" }`                            |                                                                                   |
| `/log/result`                      | **GET**  | retrieve results                   |                                                                                   | `{ "ProbandId": 3, "test": true, "result": "result" }`                            |
| `/data/11`                         | **POST** | create data file `data_011.json`   | `{`<br/>`  "data0": "test"`<br/>`  "data1": "abc"`<br/>`  "data3": "123"`<br/>`}` | `{ "file": "data/data_011.json" }`                                                |
| `/data/11`                         | **GET**  | retrieve data file `data_011.json` |                                                                                   | `{`<br/>`  "data0": "test"`<br/>`  "data1": "abc"`<br/>`  "data3": "123"`<br/>`}` |
| `/data`                            | **GET**  | list of available data sets        |                                                                                   | `[ 11 ]`                                                                          |

__[⬆ back to top](#table-of-contents)__

## Logging

* first create Log file with a POST-Request to `/log/create`
* as body, provide the header as message: `{ "message": "FrameId, IsValid, Comment;" }` writes `"FrameId, IsValid, Comment;` in the first line of the data.csv
  The response contains the current log file name, in the form `{ "file": "2023-07-27T204421.294Z" }`
  This can be used for querying data logs (see [Query Logs](#query-logs)).
* sensor data can be written in the same way by sending a POST request to `log/data` with the same body format (`{ "message": "1, true, testresult;" }` writes `1, true, testresult;` as line in the csv)
* results are written by sending a json string to `/log/result`. The body of the POST request is written as line in the result file without unmodified.
* logs are stored in `/data/log` in the format `%DATE%_data.csv` for tracking data and `%DATE%_result.json` for results.
* errors are logged in the same directory as `%DATE%_error.log`

__[⬆ back to top](#table-of-contents)__

## Query Logs

* Result sets can be retrieved by executing a GET request to `/log/result`
* Data Logs can be retrieved by executing a get request to `log/data/{file}`, where file is the file name returned by `/log/create`

__[⬆ back to top](#table-of-contents)__

## Saving data sets

When generating data, these can be stored and retrieved in the data directory:

* save a data set in json format by sending a request to `/data/{id}` with `id` being the identifier for the data set.
* the json data provided in the body of the POST request is stored as `data_{id}` in the `data` directory
* to retrieve this data set, just send a GET request to `/data/{id}`

__[⬆ back to top](#table-of-contents)__
