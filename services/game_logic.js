export class Cell {
    constructor(x, y) {
        this.is_open = false;
        this.posx = x;
        this.posy = y;
        this.number = 0;
        this.bomb = false;
    }
}

export class Field {
    constructor() {
        this.field = [];
        this.bombs = 0;
    }
    initialize(size = [6, 6]) {
        //size [x,y]
        this.size = size;
        for (let y = 0; y < this.size[1]; y++) {
            for (let x = 0; x < this.size[0]; x++) {
                this.field.push(new Cell(x, y));
            }
        }
    }
    load(field, size, bombs) {
        this.field = field;
        this.size = size;
        this.bombs = bombs;
    }
    export() {
        return ({
            field: this.field,
            size: this.size,
            bombs: this.bombs,
        });
    }
    coordinate_to_index(x, y) {
        //x rows y columns like 2D array
        return x * this.size[0] + y;
    }
    index_to_coordinate(i) {
        let rows = Math.floor(i / this.size[0]);
        let columns = i - (rows * this.size[0]);
        return [rows, columns];
    }
    is_in_field(x, y) {
        let xmax = this.size[0];
        let ymax = this.size[1];
        if (x < xmax && x >= 0 && y < ymax && y >= 0) {
            return true;
        } else {
            return false;
        }
    }
    populate_bombs(bombCount = 11) {
        let to_add;
        if (this.bombs + bombCount <= this.size[0] * this.size[1]) {
            this.bombs = this.bombs + bombCount;
            to_add = bombCount;
        } else {
            to_add = this.size[0] * this.size[1] - this.bombs;
            this.bombs = this.size[0] * this.size[1];
        }
        if (to_add == 0) {
            return false;
        }
        let x;
        let y;
        let index;
        const range = [-1, 0, 1];
        let xc;
        let yc;
        for (let i = 0; i < to_add; i++) {
            x = Math.floor(Math.random() * this.size[0]);
            y = Math.floor(Math.random() * this.size[1]);
            index = this.coordinate_to_index(x, y);
            if (this.field[index].bomb == false) {
                this.field[index].bomb = true;
                range.forEach((dx) => {
                    range.forEach((dy) => {
                        xc = x + dx;
                        yc = y + dy;
                        if (this.is_in_field(xc, yc)) {
                            index = this.coordinate_to_index(xc, yc);
                            this.field[index].number = this.field[index].number + 1;
                        }
                    })
                })
            } else {
                i = i - 1
            }
        }
        return true;
    }
    generate_field(size, bombCount) {
        this.initialize(size);
        this.populate_bombs(bombCount);
    }
    static open_cell_flags = {
        OUTSIDE: 'outside',
        OPENED: 'opened',
        BOMB: 'bomb',
        NOBOMB: 'nobomb'
    }
    open_cell(x, y) {
        //returns true if successful
        if (!this.is_in_field(x, y)) {
            //console.log(1)
            return [Field.open_cell_flags.OUTSIDE, false];
        }
        let cell = this.field[this.coordinate_to_index(x, y)];
        if (cell.is_open || (cell.is_open == true && cell.bomb == true)) {
            //console.log(2)
            return [Field.open_cell_flags.OPENED, false];
        }
        if (cell.bomb == true) {
            //console.log(3)
            cell.is_open = true;
            this.bombs = this.bombs - 1;
            //console.log(this.field[this.coordinate_to_index(x,y)])
            return [Field.open_cell_flags.BOMB, true];
        }
        if (cell.number == 0) {
            //console.log(4)
            let xc;
            let yc;
            let index;
            let sel;
            const range = [-1, 0, 1];
            cell.is_open = true;
            range.forEach((dx) => {
                range.forEach((dy) => {
                    xc = x + dx;
                    yc = y + dy;
                    if (this.is_in_field(xc, yc)) {
                        index = this.coordinate_to_index(xc, yc);
                        sel = this.field[index];
                        if (!(xc == 0 && yc == 0) && sel.is_open == false) {
                            //console.log(xc,yc);
                            this.open_cell(xc, yc);
                        }
                    }
                })
            })
        }
        cell.is_open = true;
        return [Field.open_cell_flags.NOBOMB, true];
    }
    print_field() {
        const arranged = [];
        for (let i = 0; i < this.field.length; i += this.size[1]) {
            arranged.push(this.field.slice(i, i + this.size[1]));
        }
        const output = [];
        let cell;
        let bracket;
        let mark;
        for (let i = 0; i < arranged.length; i++) {
            const row = [];
            for (let j = 0; j < arranged[0].length; j++) {
                cell = arranged[i][j];
                if (cell.is_open == false) {
                    mark = "-";
                    //mark=cell.number;
                } else if (cell.is_open == true && cell.bomb == true) {
                    mark = "X";
                } else {
                    mark = cell.number;
                }
                if (cell.bomb == true) {
                    //bracket=["{","}"];
                    bracket = ["[", "]"];
                } else {
                    bracket = ["[", "]"];
                }
                row.push(bracket[0] + mark + bracket[1]);
            }
            output.push(row.join(" "));
        }
        console.log(output.join("\n"));
    }
    get_hit_count() {
        return (this.field.map((cell) => { cell.is_open && cell.bomb }).filter(value => value === true).length);
    }
    export_display_data() {
        return (Object.fromEntries(this.field.map((cell) =>
            [
                this.coordinate_to_index(cell.posx, cell.posy),
                {
                    is_open: cell.is_open,
                    index: this.coordinate_to_index(cell.posx, cell.posy),
                    number: cell.number,
                    bomb: cell.bomb
                }
            ]
        )))
    }
}

// // Code for testing
// // Import the 'readline' module for easier input handling
// //const readline = require('readline');
// import readline from 'readline';

// // Create an interface for reading input and writing output
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

// let field=new Field()
// let result;
// field.generate_field([10,10],20)

// // Function to handle user commands
// function handleCommand(position) {
//     if(position=="x"){
//         rl.close();
//         return;
//     }else{
//         let coordinate=position.split(",")
//         result=field.open_cell(Number(coordinate[0]),Number(coordinate[1]))
//         console.log(result)
//     }
//     field.print_field()
//     console.log(field.bombs+ " bombs remaining")
//     askForCommand();
// }

// // Function to prompt user repeatedly
// function askForCommand() {
//   rl.question("\nPosition: ", handleCommand);
// }

// // Start the loop
// console.log("=== Welcome to the Game ===");
// field.print_field()
// askForCommand();
