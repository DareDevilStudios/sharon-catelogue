function getObjectSize(obj) {
    const jsonString = JSON.stringify(obj);
    return new Blob([jsonString]).size; // Returns size in bytes
}

function calculateSizeInMB(sizeInBytes) {
    return sizeInBytes / (1024 * 1024); // Convert bytes to megabytes
}

// Example object
const obj = {
    name: "round pillar",
    dimensions: "3 4",
    price: "123423",
    category: "pillar",
    image: "https://bdofkgqvlandspsaddhz.supabase.co/storage/v1/object/public/products/0.7224888278122343.jpg"
};

const objectSizeInBytes = getObjectSize(obj);
const objectSizeInMB = calculateSizeInMB(objectSizeInBytes);
const totalStorageInMB = 5; // 5 MB

const numberOfObjects = Math.floor(totalStorageInMB / objectSizeInMB);

console.log(`Size of object: ${objectSizeInBytes} bytes`);
console.log(`Size of object: ${objectSizeInMB.toFixed(2)} MB`);
console.log(`You can store approximately ${numberOfObjects} objects like this in 5 MB of storage.`);
