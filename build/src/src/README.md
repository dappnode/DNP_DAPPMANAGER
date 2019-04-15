## Remote procedure call (RPC) specification

### On success

- The message should be a short description of what happened. It is logged to the DAPPMANAGER DNP if flagged as so, and sent to the UI in case it needs to be shown to the user
- The result must be plain data relevant to the call, with no state about the success or error of the call itself. If something goes wrong, the code must throw an error, and it will be formated correctly by `./registerHandler.js`.

```js
{
    success: true,
    message: {string},
    result: {any}
}
```

### On error

- The message is the message attached to the Error thrown in the code. It should be short and descriptive and it will likely be shown in the UI as a toast. The stack will also be accessible to the user through the userActionLogs.

```js
{
    success: false,
    message: {string}
}
```
