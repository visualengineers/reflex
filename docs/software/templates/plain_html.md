# Template: Plain HTML

## Example I: Basic example

* location: `examples/html/websockets.html`
* technology: pure html + JS using websocket communication
* preconfigured websocket address (for setup in `Server`): `ws://localhost:40041/reflex`
* logs websocket messages to the screen (limited to last 100 messages, ordered chronologically)
* most basic example for testing and understanding structure of received interaction data

![Screenshot of plain html example](/reflex/assets/img/templates/screen_plain-html.png)

### Code

To receive interactions from ReFlex framework, simply open a new WebSocket connection and handle `onmessage` events of the WebSocket.

{% highlight js linenos %}

    // Let us open a web socket
    const ws = new WebSocket(address);
    
    // event when connection to websocket is established
    ws.onopen = function() {

        // ...

    };
    
    // event when websocket receives new interactions
    ws.onmessage = function (evt) { 

        // evt.data contains interactions from ReFlex framework
        const received_interactions = evt.data;

        // handle interactions update
               
    };
    
    // event when websocket connection is terminated
    ws.onclose = function() { 
        
        // websocket is closed.
        
    };

    // event for websocket error handling
    ws.onerror = function (error) {

        // handle error (log, reconnect, ...)
    }

{% endhighlight %}

## Example II: Logging and visualization

* location: `examples/html/websockets_with_logging.html`
* technology: pure html + JS using websocket communication, logs messages to logging service (if running in parallel)
* preconfigured websocket address (for setup in `Server`): `ws://localhost:40041/reflex`
* preconfigured address for logging (default address in `Logging backend`): `http://localhost:4302/`
* Features:
  * logs websocket messages to the screen (limited to last 100 messages, ordered chronologically)
  * visualizes `Interactions` with `TouchId`, `Position`, `Type` (red: `PUSH`, green: `PULL`)
  * Depth value of Interaction is mapped to the size of the circle
  * visualize connection state and connectivity to logging server

![Screenshot of plain html example](/reflex/assets/img/templates/screen_html-logging.png)

## Code

{% highlight js linenos %}
    // open the websocket
    ws = new WebSocket(address);
    
    // event when connection to websocket is established
    ws.onopen = function() {
        const conn_msg = "Successfully connected to " + address;

        // remove button and display connection state
        showWebSocketState(conn_msg, true);
    };
    
    // event when websocket receives new interactions
    ws.onmessage = function (evt) { 

        // update message number
        msgId += 1;

        // parse data
        const data = JSON.parse(evt.data);

        // display formatted message
        showMessages(msgId, data);

        // visualize messages on canvas
        showInteractions(data);

        // send interactions to logging server
        if (logMessages) {

            // log each interaction as separate data set
            const interactions = extractInteractions(data);
            interactions.forEach((msg) => 
            fetch(`${logAddress}log/data`, {

                // build message
                method: "POST",
                body: JSON.stringify({ message: msg }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            })                        
            );
        }
    };
    
    // event when websocket connection is terminated
    ws.onclose = function() { 
        const conn_msg = "Connection is closed...";

        // update button and connection state
        showWebSocketState(conn_msg, false);
    };

    // event for websocket error handling
    ws.onerror = function(error) {
        const conn_msg = `Connection Error: ${error}`;

        // update button and connection state
        showWebSocketState(conn_msg, false);
    }

{% endhighlight %}
