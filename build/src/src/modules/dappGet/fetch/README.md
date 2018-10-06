# Fetch module

## Improve speed

The fetch module has proven to be very slow. It fetches versions for:

- the current state
- the request

The current state fetch will return the same results 99% of the time, so it is important to cache it. Also, devs can install wierd versions so the state fetch has to be protected against all possible cases.
