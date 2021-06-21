
function load_original_level() {
    // original binary level data structure
    let levelsData = []

    const levelLen = 12 + 8 * 4 + 1 + 10 + 400;
    const fs = require('fs'),
        binary = fs.readFileSync('../_original/data/levels.umk');

    // level is 12x12

    for (let i = 0; i < 50; i++) {
        let pos = i * levelLen;
        console.log(`Loading position ${pos}, level ${i + 1}`);
        console.log([...binary.slice(pos + 12, pos + 44)])
        let level = {
            id: i + 1,
            name: binary.slice(pos, pos += 12).toString('utf-8').trim().replace(/\\u0000/, ""), // 12 bytes name
            itemsCount: [...binary.slice(pos, pos += 32)], // 4x8 
            // 4 times standard items count to use
            type: [...binary.slice(pos, pos += 1)][0], // 1 type
            pass: binary.slice(pos, pos += 10).map((v) => v - 73).toString('ascii'), // 10 pass -= 73
            level: [...binary.slice(pos, pos += 400)] // 4x100 level data
            // item types
            // 1 - 9 - standard bricks - 8 different colors
            // 25,26,27, 19,20,15, 14,13,12 bombs (turning to fixed, removals, turning into standard)
            // 17,18 - movers (right or left)
            // 140 - magnetic
            // 234, 221 - premium (will turn into something elese)
            // 78,77 - teleport (from -> to)
            // 141 - antigravity
            // 129 - pixie
            // 249 - immovable

        }

        if (level.type != 0) levelsData.push(level);

    }

    console.log(JSON.stringify(levelsData));


}

load_original_level()