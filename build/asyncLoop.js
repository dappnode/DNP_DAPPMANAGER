
fun(['a']);

async function fun(arr) {

  let l_array = []
  for (let i=0;i<arr.length;i++) {
    // l_array.push( loop(arr[i]) )
    l_array.push( loopParalel(arr[i]) )
  }

  for (let i=0;i<l_array.length;i++) {
    console.log('---srt '+arr[i])
    await l_array[i]
    console.log('---end '+arr[i])
  }

  // await Promise.all(l_array)

  console.log('finished all')

}



async function loop(a) {
  for (let i=0;i<5;i++) {
    await sleep( Math.floor(1000*Math.random()), a+' '+i )
  }
  // console.log('loop end: '+a)
}

async function loopParalel(a) {
  let promiseArray = []
  for (let i=0;i<5;i++) {
    promiseArray.push( sleep( Math.floor(1000*Math.random()), a+' '+i ) )
  }
  await Promise.all(promiseArray)
}

function sleep(ms, msg) {
  return new Promise((resolve) => {
    console.log('srt '+msg)
    setTimeout(function(){
      console.log('end '+msg)
      resolve()
    }, ms);
  })
}
