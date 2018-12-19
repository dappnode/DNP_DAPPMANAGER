## Basic Set functionality:

```javascript
var mySet = new Set();
mySet.add(1); // Set [ 1 ]
mySet.has(1); // true
mySet.size; // 1
mySet.delete(1); // removes 1 from the set
```

## Iterate:

```javascript
for (let item of mySet) {
  console.log(item);
}
```

## Convert to array:

```javascript
var myArr = Array.from(mySet);
```

## Intersect two sets:

```javascript
var intersection = new Set([...set1].filter(x => set2.has(x)));
```

## Difference two sets:

```javascript
var difference = new Set([...set1].filter(x => !set2.has(x)));
```
