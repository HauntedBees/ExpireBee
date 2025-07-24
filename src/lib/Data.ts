import Dexie, { type EntityTable, type IDType } from "dexie";
import type { Barcode, Category, Inventory, Location, Product, Tag } from "./Model";

const db = new Dexie("ExpireBee") as Dexie & {
    location: EntityTable<Location, "id">,
    category: EntityTable<Category, "id">,
    tag: EntityTable<Tag, "id">,
    product: EntityTable<Product, "id">,
    barcode: EntityTable<Barcode, "id">,
    inventory: EntityTable<Inventory, "id">
};

db.version(1).stores({
    location: "++id, name",
    category: "++id, name",
    tag: "++id, name, color",
    product: "++id, name, categoryId, tagIds",
    barcode: "++id, code, productId",
    inventory: "++id, name, categoryId, tagIds, purchaseDate, expirationDate, locationId, notes"
});

db.on("populate", (t: any) => {
    t.category.add({ name: "Food - Perishable" });
    t.category.add({ name: "Food - Nonperishable" });
    t.category.add({ name: "Medicine - Prescription" });
    t.category.add({ name: "Medicine - Over the Counter" });

    t.location.add({ name: "Kitchen - Fridge" });
    t.location.add({ name: "Kitchen - Freezer" });
    t.location.add({ name: "Kitchen - Top Pantry" });
    t.location.add({ name: "Kitchen - Bottom Pantry" });
    t.location.add({ name: "Kitchen - Top Open Shelf" });
    t.location.add({ name: "Kitchen - Bottom Open Shelf" });
    t.location.add({ name: "Kitchen - Other" });
    t.location.add({ name: "Bathroom - Cabinet" });
});

export default db;

export async function Upsert<T extends EntityTable<U, "id">, U extends { id?: IDType<U, "id"> }>(table: T, item: U) {
    if (item.id) {
        await table.update(item.id, item as any); // no idea how to make the type work for this, lazy "any" is the solution for now
        return item.id;
    } else {
        return await table.add(item);
    }
}
