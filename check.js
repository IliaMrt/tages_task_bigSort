import {open} from "fs/promises";

let linesCount = 0
let errorsCount = 0

function readLines(input, func) {
    let remaining = '';

    input.on('data', function (data) {
        remaining += data;
        let index = remaining.indexOf('\n');
        while (index > -1) {
            let line = remaining.substring(0, index);
            remaining = remaining.substring(index + 1);
            func(line);
            index = remaining.indexOf('\n');
        }
    });

    input.on('end', function () {
        if (remaining.length > 0) {
            func(remaining);
        }
    });
}

async function check(fileName) {
    const file = await open(fileName, 'r');
    const stream = file.createReadStream({encoding: 'utf-8'});
    let previous = ''
    await readLines(stream, (a) => {
        linesCount++
        let i = 0
        let stop=false
        let compareResult=previous.length<=a.length
        do {
            if (a[i]!=previous[i]) {
                compareResult=previous[i]?.charCodeAt(0)<a[i]?.charCodeAt(0)
                stop=true
            }
            i++
        } while ((i < Math.min(a.length, previous.length, 10))&&!stop)
        if (!compareResult){
            console.log(`Err #${++errorsCount}, line ${linesCount}: prev=${previous.slice(0, 10)}, curr=${a.slice(0, 10)}`)
        }
        previous = a
    })
    return (`Summary: ${linesCount} lines, ${errorsCount} errors.`)
}

await check(process.argv[2])
