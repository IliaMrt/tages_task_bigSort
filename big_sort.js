import {open} from 'fs/promises';

const maxMemUsage = 500 * Math.pow(2, 20)

async function readArrFromFile(fileName) {
    const resArr = [{start: 0, end: undefined}]
    const file = await open(fileName, 'r');
    const fileSize = (await file.stat()).size
    await file.close()
    let prevSymbolIsNewStr = 0
    let currentPosition = 0
    for (let i = 0; i < fileSize; i += maxMemUsage) {
        const end = i + maxMemUsage < fileSize ? i + maxMemUsage : fileSize
        const currentChunk = await read(fileName, i, end);
        for (let j = 0; j <= currentChunk.length - 1; j++) {
            if (currentChunk.charCodeAt(j) == '10') {
                resArr[resArr.length - 1].end = currentPosition - prevSymbolIsNewStr
                resArr.push({
                    start: currentPosition < fileSize - 1 ? j + i + 1 : j,
                    end: undefined
                })
                prevSymbolIsNewStr = 0
            } else prevSymbolIsNewStr = 1
            currentPosition++
        }

    }

    resArr[resArr.length - 1].end = fileSize - 1

    return resArr
}

async function read(fileName, start, end) {

    return new Promise(async (resolve) => {
        const file = await open(fileName, 'r');
        const stream = file.createReadStream({encoding: 'utf-8', start, end});
        stream.on('data', async (chunk) => {
            await file.close();//todo
            await stream.close();
            return resolve(chunk);
        });
        stream.read(end - start);
    });
}

async function writeArrToFile(inputFile, outputFile, arr) {

    let file = await open(outputFile, 'a+');
    let stream = file.createWriteStream({encoding: 'utf-8'});

    let usedMemory = 0;

    for (const strObj of arr) {
        const strLength = strObj.end - strObj.start;
        usedMemory += strLength;

        if (maxMemUsage >= usedMemory) {
            let chunk = await read(inputFile, strObj.start, strObj.end)
            if (chunk[chunk.length - 1] !== '\n') {
                chunk += '\n'
            }
            stream.write(chunk)
        } else if (maxMemUsage >= strLength) {

            stream.close();
            await file.close();

            file = await open(outputFile, 'a+');
            stream = file.createWriteStream({encoding: 'utf-8'});

            usedMemory = 0;
        }
    }

}

async function bigSort(inputFile, outputFile) {
    let arr = await readArrFromFile(inputFile)
    arr.forEach((v, i) => arr[i] = [v])
    while (arr.length > 1) {
        const tempArr = []
        for (let i = 0; i < arr.length; i += 2) {
            if (i + 1 < arr.length) {
                let temp = await merge(arr[i], arr[i + 1], inputFile)
                tempArr.push(temp)
            } else tempArr.push(arr[i])
        }
        arr = tempArr
    }
    await writeArrToFile(inputFile, outputFile, arr[0])
    console.log(`stop: ${new Date()}`)

}

async function merge(left, right, fileName) {
    let i = 0
    let j = 0
    let resArr = []
    while (i < left.length || j < right.length) {

        if (i === left.length) {
            resArr.push(...right.slice(j))
            return resArr
        }
        if (j === right.length) {
            resArr.push(...left.slice(i))
            return resArr
        }

        if (await stringsCompare(left[i], right[j], fileName))
            resArr.push(left[i++])
        else
            resArr.push(right[j++])
    }
}

async function stringsCompare(left, right, file) {
    let res = left.end - left.start <= right.end - right.start

    const endCycle = Math.min(left.end - left.start, right.end - right.start)

    for (let i = 0; i <= endCycle; i++) {
        const leftSymbol = await read(file, left.start + i, left.start + i);
        const rightSymbol = await read(file, right.start + i, right.start + i);
        if (leftSymbol != rightSymbol)
            return leftSymbol < rightSymbol
    }

    return res
}

console.log(`start: ${new Date()}`)

bigSort(process.argv[2], process.argv[3])