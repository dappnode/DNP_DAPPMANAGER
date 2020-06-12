# Test specs

Mandatory to test:

- Reducers
- Action Creators
- Container Components
- Business Logic
- ~~React~~ (not)

The test structure should be organized as Arrange, Act, Asset (AAA pattern)

```javascript
it("Should add element to the end of and array", () => {
  // Arrange
  const el = 3;
  const array = [1, 2];
  // Act
  array.push(el);
  // Assert
  expect(array.length).toBe(3);
  expect(array[array.length - 1]).toBe(el);
});
```

## Reducers

Import the reducer, the action types and see if the state mutates as expected

- Test the initial state

```javascript
it("has a default state", () => {
  expect(reducer(undefined, { type: undefined })).toEqual([]);
});
```

- Test the actions

```javascript
it("has a default state", () => {
  const devices = ["jordi"];
  expect(
    reducer(undefined, {
      type: t.UPDATE,
      payload: devices
    })
  ).toEqual(devices);
});
```

## Action creators

Action code

```javascript
function create() {
  return function(dispatch) {
    dispatch(createStart());
    return getBooking().then(
      function(data) {
        dispatch(createFinish(data));
      },
      function(err) {
        dispatch(createFail(err));
      }
    );
  };
}
```

Test code

```javascript
describe("create", () => {
  it("dispatch start and finish", done => {
    const middlewares = [thunk];
    const mockStore = configureStore(middlewares);
    const store = mockStore({});

    store.dispatch(actions.create()).then(() => {
      expect(store.getActions()[0]).toEqual(actions.createStart());
      expect(store.getActions()[1]).toEqual(actions.createFinish());
      done();
    });
  });
});
```

## Containers

The new way to test containers is through selectors

## Business logic

Only function or code outside of the regular react-redux structure

---

## References

[Unit Testing in React + Redux applications](https://www.youtube.com/watch?v=r5lhmEoaWBM)
