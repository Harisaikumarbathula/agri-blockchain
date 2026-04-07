// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FarmSupplyChain {
    enum PaymentMethod {
        UPI,
        COD
    }

    enum PaymentStatus {
        Pending,
        Paid,
        Failed,
        Collected
    }

    enum OrderStatus {
        Pending,
        Confirmed,
        Shipped,
        OutForDelivery,
        Delivered,
        Cancelled
    }

    struct Product {
        uint256 id;
        string name;
        string category;
        string unit;
        uint256 quantity;
        string batchCode;
        string originLocation;
        uint256 harvestDate;
        bool isActive;
    }

    struct Order {
        uint256 id;
        string orderNumber;
        uint256 productId;
        uint256 quantity;
        uint256 totalPaise;
        PaymentMethod paymentMethod;
        PaymentStatus paymentStatus;
        OrderStatus orderStatus;
    }

    address public immutable owner;
    uint256 public productCount;
    uint256 public orderCount;

    mapping(uint256 => Product) private products;
    mapping(uint256 => Order) private orders;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the backend signer can write");
        _;
    }

    event ProductRecorded(
        uint256 indexed productId,
        string name,
        string category,
        uint256 quantity,
        string batchCode
    );
    event ProductUpdated(
        uint256 indexed productId,
        string name,
        uint256 quantity,
        bool isActive
    );
    event ProductDeactivated(uint256 indexed productId);
    event OrderRecorded(
        uint256 indexed orderId,
        string orderNumber,
        uint256 indexed productId,
        uint256 quantity,
        uint256 totalPaise,
        PaymentMethod paymentMethod
    );
    event PaymentRecorded(
        uint256 indexed orderId,
        PaymentStatus paymentStatus,
        string paymentReference
    );
    event OrderStatusUpdated(uint256 indexed orderId, OrderStatus orderStatus);
    event OrderCancelled(uint256 indexed orderId, string orderNumber);
    event CodCollected(uint256 indexed orderId, string paymentReference);

    constructor() {
        owner = msg.sender;
    }

    function recordProduct(
        string memory name,
        string memory category,
        string memory unit,
        uint256 quantity,
        string memory batchCode,
        string memory originLocation,
        uint256 harvestDate
    ) external onlyOwner returns (uint256) {
        require(bytes(name).length > 0, "Product name is required");
        require(bytes(category).length > 0, "Category is required");
        require(bytes(unit).length > 0, "Unit is required");
        require(quantity > 0, "Quantity must be greater than zero");
        require(bytes(batchCode).length > 0, "Batch code is required");
        require(bytes(originLocation).length > 0, "Origin location is required");
        require(harvestDate > 0, "Harvest date is required");

        productCount += 1;
        products[productCount] = Product({
            id: productCount,
            name: name,
            category: category,
            unit: unit,
            quantity: quantity,
            batchCode: batchCode,
            originLocation: originLocation,
            harvestDate: harvestDate,
            isActive: true
        });

        emit ProductRecorded(productCount, name, category, quantity, batchCode);
        return productCount;
    }

    function updateProduct(
        uint256 productId,
        string memory name,
        string memory category,
        string memory unit,
        uint256 quantity,
        string memory batchCode,
        string memory originLocation,
        uint256 harvestDate,
        bool isActive
    ) external onlyOwner {
        Product storage product = products[productId];

        require(product.id != 0, "Product not found");
        require(bytes(name).length > 0, "Product name is required");
        require(bytes(category).length > 0, "Category is required");
        require(bytes(unit).length > 0, "Unit is required");
        require(bytes(batchCode).length > 0, "Batch code is required");
        require(bytes(originLocation).length > 0, "Origin location is required");
        require(harvestDate > 0, "Harvest date is required");

        product.name = name;
        product.category = category;
        product.unit = unit;
        product.quantity = quantity;
        product.batchCode = batchCode;
        product.originLocation = originLocation;
        product.harvestDate = harvestDate;
        product.isActive = isActive;

        emit ProductUpdated(productId, name, quantity, isActive);
    }

    function deactivateProduct(uint256 productId) external onlyOwner {
        Product storage product = products[productId];

        require(product.id != 0, "Product not found");
        product.isActive = false;

        emit ProductDeactivated(productId);
    }

    function recordOrder(
        string memory orderNumber,
        uint256 productId,
        uint256 quantity,
        uint256 totalPaise,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus
    ) external onlyOwner returns (uint256) {
        Product storage product = products[productId];

        require(product.id != 0, "Product not found");
        require(product.isActive, "Product is inactive");
        require(quantity > 0, "Quantity must be greater than zero");
        require(totalPaise > 0, "Total must be greater than zero");
        require(product.quantity >= quantity, "Insufficient quantity");

        product.quantity -= quantity;
        orderCount += 1;

        orders[orderCount] = Order({
            id: orderCount,
            orderNumber: orderNumber,
            productId: productId,
            quantity: quantity,
            totalPaise: totalPaise,
            paymentMethod: paymentMethod,
            paymentStatus: paymentStatus,
            orderStatus: OrderStatus.Pending
        });

        if (product.quantity == 0) {
            product.isActive = false;
        }

        emit OrderRecorded(
            orderCount,
            orderNumber,
            productId,
            quantity,
            totalPaise,
            paymentMethod
        );
        return orderCount;
    }

    function recordPayment(
        uint256 orderId,
        PaymentStatus paymentStatus,
        string memory paymentReference
    ) external onlyOwner {
        Order storage order = orders[orderId];

        require(order.id != 0, "Order not found");
        require(order.orderStatus != OrderStatus.Cancelled, "Order is cancelled");
        require(
            paymentStatus == PaymentStatus.Paid || paymentStatus == PaymentStatus.Failed,
            "Invalid payment update"
        );

        order.paymentStatus = paymentStatus;

        emit PaymentRecorded(orderId, paymentStatus, paymentReference);
    }

    function updateOrderStatus(uint256 orderId, OrderStatus orderStatus) external onlyOwner {
        Order storage order = orders[orderId];

        require(order.id != 0, "Order not found");
        require(order.orderStatus != OrderStatus.Cancelled, "Order is cancelled");
        require(orderStatus != OrderStatus.Cancelled, "Use cancelOrder");

        order.orderStatus = orderStatus;

        emit OrderStatusUpdated(orderId, orderStatus);
    }

    function cancelOrder(uint256 orderId) external onlyOwner {
        Order storage order = orders[orderId];
        Product storage product = products[order.productId];

        require(order.id != 0, "Order not found");
        require(order.orderStatus == OrderStatus.Pending, "Only pending orders can cancel");

        order.orderStatus = OrderStatus.Cancelled;
        product.quantity += order.quantity;
        product.isActive = true;

        emit OrderCancelled(orderId, order.orderNumber);
    }

    function recordCodCollected(
        uint256 orderId,
        string memory paymentReference
    ) external onlyOwner {
        Order storage order = orders[orderId];

        require(order.id != 0, "Order not found");
        require(order.paymentMethod == PaymentMethod.COD, "Only COD orders can collect");
        require(order.orderStatus == OrderStatus.Delivered, "Order must be delivered");

        order.paymentStatus = PaymentStatus.Collected;

        emit CodCollected(orderId, paymentReference);
    }

    function getProduct(uint256 productId) external view returns (Product memory) {
        require(products[productId].id != 0, "Product not found");
        return products[productId];
    }

    function getAllProducts() external view returns (Product[] memory) {
        Product[] memory allProducts = new Product[](productCount);

        for (uint256 i = 1; i <= productCount; i++) {
            allProducts[i - 1] = products[i];
        }

        return allProducts;
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        require(orders[orderId].id != 0, "Order not found");
        return orders[orderId];
    }
}
