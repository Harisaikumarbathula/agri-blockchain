async function seed() {
  const baseUrl = 'http://127.0.0.1:5000/api';
  
  try {
    console.log("Registering a new farmer...");
    const email = `farmer_${Date.now()}@example.com`;
    const resAuth = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Farmer",
        email: email,
        password: "password123",
        role: "farmer"
      })
    });
    
    const authData = await resAuth.json();
    if (!resAuth.ok) throw new Error(JSON.stringify(authData));
    
    const token = authData.token;
    console.log(`Farmer registered with email: ${email}`);
    
    console.log("Adding 10 products...");
    for (let i = 1; i <= 10; i++) {
        const productPayload = {
            name: `Test Product ${i} (${Date.now()})`,
            category: "vegetables",
            quantity: 50 + i,
            unit: "kg",
            pricePaise: 150000 + (1000 * i), // 1500 Rs
            originLocation: "Test Farm",
            harvestDate: new Date().toISOString(),
            description: `This is a test product number ${i}`,
            imageUrl: ""
        };

        const resProduct = await fetch(`${baseUrl}/products`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(productPayload)
        });

        const productData = await resProduct.json();
        if (!resProduct.ok) {
           console.error(`Failed to add product ${i}:`, productData.message || productData);
        } else {
           console.log(`Product ${i} added. Blockchain ID: ${productData.product.blockchainId}`);
        }
    }
    console.log("Seeding complete!");
  } catch (err) {
    console.error("Error during seeding:", err);
  }
}

seed();
