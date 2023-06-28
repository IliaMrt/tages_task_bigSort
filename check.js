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

    await readLines(stream, (current) => {

        linesCount++
        let i = 0
        let stop = false

        let compareResult = previous.length <= current.length

        do {
            if (current[i] != previous[i]) {
                compareResult = previous[i]?.charCodeAt(0) < current[i]?.charCodeAt(0)
                stop = true
            }
            i++
        } while ((i < Math.min(current.length, previous.length, 10)) && !stop)

        if (!compareResult) {
            console.log(`Err #${++errorsCount}, line ${linesCount}: prev=${previous.slice(0, 10)}, curr=${current.slice(0, 10)}`)
        }

        previous = current
    })
}

await check(process.argv[2])
