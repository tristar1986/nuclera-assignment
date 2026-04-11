import { parse, format } from 'date-fns';
import { Item } from "./Item";

export class Project {
    name: string;
    description: string;
    status: ProjectStatus;
    items: Item[];
    createdAt: Date;
    itemCount: number;
    
    constructor(name: string, status: ProjectStatus, createdAt: string, description?: string, itemCount?: number, items?: Item[]) {
        this.name = name;
        this.description = description || "";
        this.status = status;
        this.createdAt = parse(createdAt, 'dd/MM/yyyy', new Date());;
        this.items = items || [];
        if (this.items.length === 0) {
            this.itemCount = itemCount || 0;
        }
        else {            
            this.itemCount = this.items.length;
        }
    }

    isEqualTo(other: Project, fromProjectPage: boolean = false): boolean {
        if (this.name !== other.name) return false;
        if (this.status !== other.status) return false;
        if (this.itemCount !== other.itemCount) return false;
        if (this.createdAt.getTime() !== other.createdAt.getTime()) return false;
        if (!fromProjectPage) { // If we comparing project objects from the project page then we can't compare certain fields as they are not present.
            if (this.description !== other.description) return false;
        }
        return true;
    }
}

export enum ProjectStatus {
    active = "active",
    completed = "completed",
    archived = "archived"
}