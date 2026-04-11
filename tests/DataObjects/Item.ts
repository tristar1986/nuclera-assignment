export class Item {
    name: string;
    description: string;
    status: ItemStatus;

    constructor(name: string, description: string, status: ItemStatus) {
        this.name = name;
        this.description = description;
        this.status = status;
    }
}

export enum ItemStatus {
    Todo = "Todo",
    InProgress = "In Progress",
    Done = "Done"
}