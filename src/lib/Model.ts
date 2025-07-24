import type dayjs from "dayjs";

export enum SortOrder {
    Date,
    Name,
    Location
}

export type Location = {
    id?: number;
    name: string;
};

export type Category = {
    id?: number;
    name: string;
};

export type Tag = {
    id?: number;
    name: string;
    color: string;
};

export enum MetadataType {
    Location,
    Category,
    Tag
}

export type Product = {
    id?: number;
    name: string;
    categoryId?: number;
    tagIds?: number[];
};

export type Barcode = {
    id?: number;
    code: string;
    productId: number;
};

export type Inventory = Product & {
    purchaseDate?: Date;
    expirationDate?: Date;
    openedDate?: Date;
    quantity: number;
    locationId?: number;
    notes: string;
};

export type InventoryView = Inventory & {
    expireDays: number;
    dayjsPurchase: dayjs.Dayjs;
    dayjsExpire: dayjs.Dayjs;
};

export type Dictionary<T> = { [key: number]: T };

export function ToDictionary<T extends { id?: number }>(records: T[]): Dictionary<T> {
    const dict: Dictionary<T> = {};
    records.forEach(i => dict[i.id || 0] = i);
    return dict;
}