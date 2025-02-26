const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL database configuration
const pool = mysql.createPool({
  host: '66.198.240.15',
  user: 'nokhnzpl_magikosAdmin',
  password: 'magikosTech@2024',
  database: 'nokhnzpl_amaziaDB',
  debug: false
});

app.get('/', function (req, res) {
  res.send('Welcome to my Node.js application!');
});

app.post('/data', function (req, res) {
  const arrayOfObjects = req.body;
  console.log(arrayOfObjects);
  res.json({ receivedData: arrayOfObjects });
});

// Endpoint to test database connection
app.get('/testdb', function (req, res) {
  pool.query('SELECT * from UnifiedOrders LIMIT 10', function (error, results, fields) {
    if (error) {
      console.error('Error testing database connection:', error);
      res.status(500).send('Error testing database connection');
    } else {
      res.send('Database connection successful!');
    }
  });
});


/** endpoint to read a specific order from Unified Orders table */
app.get('/getSingleOrder/:orderID', function (req, res) {
  const orderID = req.params.orderID;
  pool.query('SELECT * FROM UnifiedOrders WHERE Order_ID = ?', [orderID], function (error, results) {
    if (error) {
      res.status(500).send("Error fetching order: " + error);
    } else {
      res.send(results);
    }
  });
});


/** Endpoint to get orders from the last 2 years where the buyer email is missing */
app.get('/getOrdersWhere', function (req, res) {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Start and end dates are required" });
  }

  const query = `
    SELECT * FROM UnifiedOrders 
    WHERE (Buyer_email IS NULL OR Buyer_email = '') 
    AND Order_Date BETWEEN ? AND ?
  `;

  pool.query(query, [startDate, endDate], function (error, results) {
    if (error) {
      res.status(500).json({ error: "Error fetching orders: " + error });
    } else {
      res.status(200).json(results);
    }
  });
});

app.get('/getItemsWhere', function (req, res) {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Start and end dates are required" });
  }

  const query = `
    SELECT 
      uo.Order_ID, 
      GROUP_CONCAT(ui.Item_name SEPARATOR ', ') AS Item_names, 
      uo.Order_Date, 
      uo.Customer_Name, 
      uo.Buyer_email 
    FROM UnifiedOrders uo
    JOIN UnifiedItems ui ON uo.Order_ID = ui.Order_ID
    WHERE uo.Order_Date BETWEEN ? AND ?
    GROUP BY uo.Order_ID;
  `;

  pool.query(query, [startDate, endDate], function (error, results) {
    if (error) {
      res.status(500).json({ error: "Error fetching orders: " + error });
    } else {
      res.status(200).json(results);
    }
  });
});


/** Endpoint to add orders in bulk to Unified Orders table */
app.post('/addOrders', function (req, res) {
  var ordersArr = req.body;
  var orderIDs = ordersArr.map(order => order.Order_ID);

  // Query to check for existing Order_IDs
  const checkQuery = `SELECT Order_ID FROM UnifiedOrders WHERE Order_ID IN (?)`;

  pool.query(checkQuery, [orderIDs], function (error, results) {
    if (error) {
      console.error('Error checking existing orders:', error);
      return res.status(500).send('Error checking existing orders');
    }

    const existingOrderIDs = results.map(row => row.Order_ID);
    if (existingOrderIDs.length > 0) {
      return res.status(409).json({
        message: 'Duplicate Order_IDs found',
        duplicateOrderIDs: existingOrderIDs
      });
    }

    // If no duplicates, proceed with insertion
    const insertQuery = `
    INSERT INTO UnifiedOrders (
      Source, Order_ID, Order_Date, Qty_of_LineItems, Ops_Shipped_Status, Ops_Shipped_Date, 
      Source_Shipped_Status, Source_Shipped_Date, Buyer_User_ID, Buyer_email, Customer_Name, 
      Address_Line1, Address_Line2, Address_City, Address_State, Address_postalCode, 
      Address_Country, Address_Country_Code, Customer_Address, Order_Total, Order_Value, 
      Shipping_Amount, Sales_Tax, Handling_Cost, Discount_Total, Coupon_Code, Payment_status, 
      Payment_method, Payment_Info, Payment_Reference_ID, Message_from_Buyer, Gift_Message, 
      Gift_Wrap_Price, Billing_Name, Billing_Address1, Billing_Address2, Billing_City, 
      Billing_State, Billing_State_Code, Billing_Country, Billing_Country_Code, Billing_Zip_Code, 
      Shipping_Name, Shipping_Email, Shipping_Address1, Shipping_Address2, Shipping_City, 
      Shipping_State, Shipping_State_Code, Shipping_Country, Shipping_Country_Code, 
      Shipping_Zipcode, Shipping_Phone, Shipping_Company, Shipping_ID, Shipping_Method, 
      Coupon_Buyer, Coupon_Shop, ReportFlag, Expected_ShipDate
    ) 
    VALUES ?`;

    const values = ordersArr.map(order => [
      order.Source, order.Order_ID, order.Order_Date, order.Qty_of_LineItems, order.Ops_Shipped_Status,
      order.Ops_Shipped_Date, order.Source_Shipped_Status, order.Source_Shipped_Date, order.Buyer_User_ID,
      order.Buyer_email, order.Customer_Name, order.Address_Line1, order.Address_Line2, order.Address_City,
      order.Address_State, order.Address_postalCode, order.Address_Country, order.Address_Country_Code,
      order.Customer_Address, order.Order_Total, order.Order_Value, order.Shipping_Amount, order.Sales_Tax,
      order.Handling_Cost, order.Discount_Total, order.Coupon_Code, order.Payment_status, order.Payment_method,
      order.Payment_Info, order.Payment_Reference_ID, order.Message_from_Buyer, order.Gift_Message,
      order.Gift_Wrap_Price, order.Billing_Name, order.Billing_Address1, order.Billing_Address2, order.Billing_City,
      order.Billing_State, order.Billing_State_Code, order.Billing_Country, order.Billing_Country_Code,
      order.Billing_Zip_Code, order.Shipping_Name, order.Shipping_Email, order.Shipping_Address1, order.Shipping_Address2,
      order.Shipping_City, order.Shipping_State, order.Shipping_State_Code, order.Shipping_Country,
      order.Shipping_Country_Code, order.Shipping_Zipcode, order.Shipping_Phone, order.Shipping_Company,
      order.Shipping_ID, order.Shipping_Method, order.Coupon_Buyer, order.Coupon_Shop, "0", order.Expected_ShipDate
    ]);

    pool.query(insertQuery, [values], function (error, results) {
      if (error) {
        console.error('Error inserting orders:', error);
        return res.status(500).send('Error inserting orders');
      } else {
        console.log('Orders inserted successfully');
        return res.status(200).send('Orders inserted successfully');
      }
    });
  });
});


/** Endpoint to add items in bulk to Unified Items table */
app.post('/addItems', function (req, res) {
  var itemsArr = req.body;
  var qrCodes = itemsArr.map(item => item.Qr_Code);

  // Query to check for existing Qr_Code values
  const checkQuery = `SELECT Qr_Code FROM UnifiedItems WHERE Qr_Code IN (?)`;

  pool.query(checkQuery, [qrCodes], function (error, results) {
    if (error) {
      console.error('Error checking existing items:', error);
      return res.status(500).send('Error checking existing items');
    }

    const existingQrCodes = results.map(row => row.Qr_Code);
    if (existingQrCodes.length > 0) {
      return res.status(409).json({
        message: 'Duplicate Qr_Codes found',
        duplicateQrCodes: existingQrCodes
      });
    }

    // If no duplicates, proceed with insertion
    const insertQuery = `
    INSERT INTO UnifiedItems (
      Source, Order_ID, Order_Date, Item_name, Item_Quantity, Item_Listing_ID,
      Item_SKU, Item_Product_ID, Item_Transaction_ID, Item_Variation_name1, Item_Variation_value1,
      Item_Variation_name2, Item_Variation_value2, Item_Variation_name3, Item_Variation_value3,
      Item_Variation_name4, Item_Variation_value4, Item_Variation_name5, Item_Variation_value5,
      Item_Variation_name6, Item_Variation_value6, Item_Variation_name7, Item_Variation_value7,
      Item_Variation_name8, Item_Variation_value8, Qr_Code, Source_Status, Source_Shipped_Date,
      Ops_Shipped_Status, Ops_Shipped_Date, Item_Price, Order_Total, Shipping_Company, Shipping_ID,
      Item_Min_Days, Item_Max_Days, ReportFlag, ItemPrice_Avg, ConversionRate, ItemPrice_INR, Customer_Name, Expected_ShipDate
    ) 
    VALUES ?`;

    const values = itemsArr.map(item => [
      item.Source, item.Order_ID, item.Order_Date, item.Item_name, item.Item_Quantity, item.Item_Listing_ID,
      item.Item_SKU, item.Item_Product_ID, item.Item_Transaction_ID, item.Item_Variation_name1, item.Item_Variation_value1,
      item.Item_Variation_name2, item.Item_Variation_value2, item.Item_Variation_name3, item.Item_Variation_value3,
      item.Item_Variation_name4, item.Item_Variation_value4, item.Item_Variation_name5, item.Item_Variation_value5,
      item.Item_Variation_name6, item.Item_Variation_value6, item.Item_Variation_name7, item.Item_Variation_value7,
      item.Item_Variation_name8, item.Item_Variation_value8, item.Qr_Code, item.Source_Status, item.Source_Shipped_Date,
      item.Ops_Shipped_Status, item.Ops_Shipped_Date, item.Item_Price, item.Order_Total, item.Shipping_Company, item.Shipping_ID,
      item.Item_Min_Days, item.Item_Max_Days, "0", item.ItemPrice_Avg, item.ConversionRate, item.ItemPrice_INR, item.Customer_Name, item.Expected_ShipDate
    ]);

    pool.query(insertQuery, [values], function (error, results) {
      if (error) {
        console.error('Error inserting items:', error);
        return res.status(500).send('Error inserting items');
      } else {
        console.log('Items inserted successfully');
        return res.status(200).send('Items inserted successfully');
      }
    });
  });
});


/** Endpoint to add orders in bulk to Unified Forms table */
app.post('/addFormOrders', function (req, res) {
  const ordersArr = req.body;

  // Validate input data
  if (!Array.isArray(ordersArr) || ordersArr.length === 0) {
    return res.status(400).send('Invalid input data');
  }

  // Construct the insert query
  const insertQuery = `
  INSERT INTO UnifiedForms (
  Type,Order_Number,Order_Date,Email_Address,Wedding_Date,NeedBy_Date,Wedding_Colors,Adult_Outfits,Any_Child_Outfits,Child_Outfits,
  Fabric_Selected,Sizing_Country,Adult_1,Adult_2,Adult_3,Adult_4,Adult_5,
  Adult_6,Adult_7,Adult_8,Adult_9,Adult_10,Adult_11,Adult_12,Adult_13,Adult_14,
  Adult_15,Adult_16,Adult_17,Adult_18,Adult_19,Adult_20,Adult_21,Adult_22,Adult_23,
  Adult_24,Adult_25,Child_1,Child_2,Child_3,Child_4,Child_5,Free_Belt_Loops,Add_on,
  Heart_Shaped_Cut_Name,Heart_Shaped_Cut_Price,Heart_Shaped_Cut_Quantity,Selected_Packaging,
  Add_Robes_Flag,Discounted_Cost_Robes_Name,Discounted_Cost_Robes_Price,Discounted_Cost_Robes_Quantity,
  Total,Offer_Emails,CreatedBy_UserID,Entry_Id,Entry_Date,Source_Url,Transaction_Id,Payment_Amount,
  Payment_Date,Payment_Status,Post_Id,User_Agent,User_IP,Reviewed_Status,Shipped_Status
  ) 
  VALUES ?`;

  // Map orders array to values array
  const values = ordersArr.map(form => {
    return [
      form.Type, form.Order_Number, form.Order_Date, form.Email_Address, form.Wedding_Date, form.NeedBy_Date, form.Wedding_Colors, form.Adult_Outfits, form.Any_Child_Outfits,
      form.Child_Outfits, form.Fabric_Selected, form.Sizing_Country, form.Adult_1, form.Adult_2, form.Adult_3, form.Adult_4, form.Adult_5,
      form.Adult_6, form.Adult_7, form.Adult_8, form.Adult_9, form.Adult_10, form.Adult_11, form.Adult_12, form.Adult_13, form.Adult_14,
      form.Adult_15, form.Adult_16, form.Adult_17, form.Adult_18, form.Adult_19, form.Adult_20, form.Adult_21, form.Adult_22, form.Adult_23,
      form.Adult_24, form.Adult_25, form.Child_1, form.Child_2, form.Child_3, form.Child_4, form.Child_5, form.Free_Belt_Loops, form.Add_on,
      form.Heart_Shaped_Cut_Name, form.Heart_Shaped_Cut_Price, form.Heart_Shaped_Cut_Quantity, form.Selected_Packaging,
      form.Add_Robes_Flag, form.Discounted_Cost_Robes_Name, form.Discounted_Cost_Robes_Price, form.Discounted_Cost_Robes_Quantity,
      form.Total, form.Offer_Emails, form.CreatedBy_UserID, form.Entry_Id, form.Entry_Date, form.Source_Url, form.Transaction_Id, form.Payment_Amount,
      form.Payment_Date, form.Payment_Status, form.Post_Id, form.User_Agent, form.User_IP, form.Reviewed_Status, form.Shipped_Status
    ];
  });

  // Execute the SQL insert query
  pool.query(insertQuery, [values], function (error, results) {
    if (error) {
      console.error('Error inserting form orders:', error);
      return res.status(500).send('Error inserting form orders');
    } else {
      console.log('Forms Orders inserted successfully');
      return res.status(200).send('Forms Orders inserted successfully');
    }
  });
});

/** endpoint to fetch single item from Unified Forms */
app.get('/getFormOrder/:orderID', function (req, res) {
  const orderID = req.params.orderID;
  pool.query('SELECT * FROM UnifiedForms WHERE Order_Number = ?', [orderID], function (error, results) {
    if (error) {
      res.status(500).send("Error fetching item: " + error);
    } else {
      res.send(results);
    }
  });
});

/** endpoint to fetch single item from Unified Forms based on Type */
app.get('/getFormOrderByType/:type', function (req, res) {
  let type = req.params.type;

  // Escape the single quotes in the query correctly
  pool.query(
    "SELECT * FROM UnifiedForms WHERE Type = ? AND Reviewed_Status = 'Unreviewed' AND (Shipped_Status = '' OR Shipped_Status IS NULL)",
    [type],
    function (error, results) {
      if (error) {
        res.status(500).send("Error fetching form: " + error);
      } else {
        res.send(results);
      }
    }
  );
});

/** endpoint to update an order in Unified Forms table using Order ID and Type*/
app.post('/updateFormOrders', function (req, res) {
  const data = req.body;

  if (!data.Order_Number || !data.Type) {
    return res.status(400).send('Order Number and Type are required');
  }

  const { Order_Number, Type, ...updateFields } = data;

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).send('No fields provided for update');
  }

  const updateQuery = `
    UPDATE UnifiedForms 
    SET ${Object.keys(updateFields).map(column => `${column} = ?`).join(', ')} 
    WHERE Order_Number = ? AND Type = ?`;

  const updateValues = [...Object.values(updateFields), Order_Number, Type];

  console.log(updateQuery);

  pool.query(updateQuery, updateValues, function (error, results) {
    if (error) {
      console.error('Error updating form:', error);
      return res.status(500).send('Error updating form');
    }
    console.log('Form updated successfully');
    res.send('Form updated successfully');
  });
});

/** endpoint to update an order in Unified Forms table using Order Number only*/
app.post('/updateFormByOrderID', function (req, res) {
  const data = req.body;

  if (!data.Order_Number) {
    return res.status(400).send('Order Number is required');
  }

  const { Order_Number, ...updateFields } = data;

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).send('No fields provided for update');
  }

  const updateQuery = `
    UPDATE UnifiedForms 
    SET ${Object.keys(updateFields).map(column => `${column} = ?`).join(', ')} 
    WHERE Order_Number = ?`;

  const updateValues = [...Object.values(updateFields), Order_Number];

  console.log(updateQuery);

  pool.query(updateQuery, updateValues, function (error, results) {
    if (error) {
      console.error('Error updating form:', error);
      return res.status(500).send('Error updating form');
    }
    console.log('Form updated successfully');
    res.send('Form updated successfully');
  });
});


/** endpoint to fetch order items from Unified Items by transaction id*/
app.get('/getItemByTransactionID/:orderID', function (req, res) {
  const orderID = req.params.orderID;
  pool.query('SELECT * FROM UnifiedItems WHERE Item_Transaction_ID = ?', [orderID], function (error, results) {
    if (error) {
      res.status(500).send("Error fetching item: " + error);
    } else if (results.length === 0) {
      res.status(404).send("Transaction ID does not exist.");
    } else {
      res.send(results);
    }
  });
});

/** endpoint to fetch single item from Unified Items */
app.get('/getSingleItem/:orderID', function (req, res) {
  const orderID = req.params.orderID;
  pool.query('SELECT * FROM UnifiedItems WHERE Order_ID = ?', [orderID], function (error, results) {
    if (error) {
      res.status(500).send("Error fetching item: " + error);
    } else if (results.length === 0) {
      res.status(404).send("Order ID does not exist.");
    } else {
      res.send(results);
    }
  });
});


/** endpoint to fetch all items from Unified Items */
app.get('/items', function (req, res) {
  pool.query('SELECT * FROM UnifiedItems', function (error, results) {
    if (error) {
      console.error('Error reading orders:', error);
      res.status(500).send('Error reading orders');
    } else {
      res.json(results);
    }
  });
});

/** endpoint to fetch Order ID and Order date from Unified Orders table */
app.get('/ordersByDate', function (req, res) {
  pool.query('Select Order_ID,Order_Date from UnifiedOrders ORDER BY Order_Date DESC', function (error, results) {
    if (error) {
      res.status(500).send("Orders could not be fetched")
    } else {
      res.send(results)
    }
  });
})

/** endpoint to update an order in Unified Orders table using Order ID */
app.post('/updateOrders', function (req, res) {
  // Get the data from the request body
  const data = req.body;

  const updateQuery = `UPDATE UnifiedOrders SET ${Object.keys(data).map(column => `${column} = ?`).join(', ')} WHERE Order_ID = ?`;
  const updateValues = [...Object.values(data), data.Order_ID];

  console.log(updateQuery)

  // Execute the SQL update query
  pool.query(updateQuery, updateValues, function (error, results) {
    if (error) {
      console.error('Error updating order:', error);
      res.status(500).send('Error updating order');
    } else {
      console.log('Order updated successfully');
      res.send('Order updated successfully');
    }
  });
});

/** endpoint to get unshipped orders from Unified Orders table */
app.get('/getUnshippedOrders', function (req, res) {
  pool.query('SELECT * FROM UnifiedOrders WHERE Source_Shipped_Status = "Unshipped"', function (error, results) {
    if (error) {
      console.error('Error reading unshipped orders:', error);
      res.status(500).send('Error reading unshipped orders');
    } else {
      res.json(results);
    }
  });
});

/** endpoint to get unshipped items from Unified Items table */
app.get('/getUnshippedItems', function (req, res) {
  pool.query('SELECT * FROM UnifiedItems WHERE Source_Shipped_Status = "Unshipped"', function (error, results) {
    if (error) {
      console.error('Error reading unshipped items:', error);
      res.status(500).send('Error reading unshipped items');
    } else {
      res.json(results);
    }
  });
});

/** endpoint to update an item in Unified Orders table using Order ID */
app.post('/updateItems', function (req, res) {
  // Get the data from the request body
  const data = req.body;

  const updateQuery = `UPDATE UnifiedItems SET ${Object.keys(data).map(column => `${column} = ?`).join(', ')} WHERE Order_ID = ?`;
  const updateValues = [...Object.values(data), data.Order_ID];

  console.log(updateQuery)

  // Execute the SQL update query
  pool.query(updateQuery, updateValues, function (error, results) {
    if (error) {
      console.error('Error updating item:', error);
      res.status(500).send('Error updating item');
    } else {
      console.log('Item updated successfully');
      res.send('Item updated successfully');
    }
  });
});

/** endpoint to update multiple orders in Unified Orders table using Order ID */
app.post('/updateAllOrders', function (req, res) {
  const data = req.body;

  const failedOrders = [];

  let updatedOrdersCount = 0;

  data.forEach(order => {
    const orderId = order.Order_ID;

    const columnsToUpdate = Object.keys(order);
    const updateQuery = `UPDATE UnifiedOrders SET ${columnsToUpdate.map(column => `${column} = ?`).join(', ')} WHERE Order_ID = ?`;

    const updateValues = [...Object.values(order), orderId];

    console.log(updateQuery);

    pool.query(updateQuery, updateValues, function (error, results) {
      if (error) {
        console.error(`Error updating order ${orderId}:`, error);
        failedOrders.push(orderId);
      } else {
        if (results.affectedRows > 0) {
          updatedOrdersCount += results.affectedRows;
          console.log(`Order ${orderId} updated successfully`);
        } else {
          console.log(`Order ${orderId} does not exist in the database`);
          failedOrders.push(orderId);
        }
      }

      console.log("updated orders count " + updatedOrdersCount)
      if (updatedOrdersCount + failedOrders.length === data.length) {
        if (updatedOrdersCount > 0) {
          let responseMessage = `Updated ${updatedOrdersCount} orders successfully. `;
          if (failedOrders.length > 0) {
            responseMessage += `Failed to update orders: ${failedOrders.join(', ')}`;
          }
          res.json({
            status: "success",
            failedOrders: failedOrders
          })
        } else {
          res.json({
            status: "failed",
            failedOrders: failedOrders
          })
        }
      }
    });
  });
});

/** endpoint to update multiple items in Unified Items table using Order ID */
app.post('/updateAllItems', function (req, res) {
  const data = req.body;

  const failedOrders = [];

  let updatedItemsCount = 0;

  data.forEach(order => {
    const orderId = order.Order_ID;

    const columnsToUpdate = Object.keys(order);
    const updateQuery = `UPDATE UnifiedItems SET ${columnsToUpdate.map(column => `${column} = ?`).join(', ')} WHERE Order_ID = ?`;

    const updateValues = [...Object.values(order), orderId];

    console.log(updateQuery);

    pool.query(updateQuery, updateValues, function (error, results) {
      if (error) {
        console.error(`Error updating order ${orderId}:`, error);
        failedOrders.push(orderId);
      } else {
        if (results.affectedRows > 0) {
          updatedItemsCount += results.affectedRows;
          console.log(`Order ${orderId} updated successfully`);
        } else {
          console.log(`Order ${orderId} does not exist in the database`);
          failedOrders.push(orderId);
        }
      }

      console.log("updated orders count " + updatedItemsCount)
      if (updatedItemsCount + failedOrders.length === data.length) {
        if (updatedItemsCount > 0) {
          let responseMessage = `Updated ${updatedItemsCount} orders successfully. `;
          if (failedOrders.length > 0) {
            responseMessage += `Failed to update orders: ${failedOrders.join(', ')}`;
          }
          res.json({
            status: "success",
            failedOrders: failedOrders
          })
        } else {
          res.json({
            status: "failed",
            failedOrders: failedOrders
          })
        }
      }
    });
  });
});

app.post('/updateAllForms', function (req, res) {
  const data = req.body;

  const failedOrders = [];
  let updatedOrdersCount = 0;

  data.forEach(order => {
    const { Order_Number, Type, ...updateFields } = order;

    if (!Order_Number || !Type) {
      failedOrders.push({ Order_Number, Type, reason: 'Order Number or Type missing' });
      return;
    }

    if (Object.keys(updateFields).length === 0) {
      failedOrders.push({ Order_Number, Type, reason: 'No fields provided for update' });
      return;
    }

    const updateQuery = `
      UPDATE UnifiedForms 
      SET ${Object.keys(updateFields).map(column => `${column} = ?`).join(', ')} 
      WHERE Order_Number = ? AND Type = ?`;

    const updateValues = [...Object.values(updateFields), Order_Number, Type];

    console.log(updateQuery);

    pool.query(updateQuery, updateValues, function (error, results) {
      if (error) {
        console.error(`Error updating form ${Order_Number}, Type ${Type}:`, error);
        failedOrders.push({ Order_Number, Type, reason: 'Database error' });
      } else {
        if (results.affectedRows > 0) {
          updatedOrdersCount += results.affectedRows;
          console.log(`Form ${Order_Number}, Type ${Type} updated successfully`);
        } else {
          console.log(`Form ${Order_Number}, Type ${Type} does not exist in the database`);
          failedOrders.push({ Order_Number, Type, reason: 'Not found in database' });
        }
      }

      if (updatedOrdersCount + failedOrders.length === data.length) {
        const responseMessage = {
          updatedOrdersCount,
          failedOrders,
        };
        res.json(responseMessage);
      }
    });
  });
});



/** endpoint get an order from Unified Orders table using Customer Name*/
app.get('/getOrderByName/:customerName', function (req, res) {
  const c_name = req.params.customerName;
  pool.query('SELECT * FROM UnifiedOrders WHERE Customer_Name = ?', [c_name], function (error, results) {
    if (error) {
      res.status(500).send("Error fetching order: " + error);
    } else {
      res.send(results);
    }
  });
});

/** endpoint get an order from Unified Orders table using Customer Name*/
app.get('/getItemsByName/:customerName', function (req, res) {
  const c_name = req.params.customerName;
  pool.query('SELECT * FROM UnifiedItems WHERE Customer_Name = ?', [c_name], function (error, results) {
    if (error) {
      res.status(500).send("Error fetching order: " + error);
    } else {
      res.send(results);
    }
  });
});



/** endpoint to add orders to Satin Orders table */
app.post('/addSatinOrders', function (req, res) {
  const ordersArr = req.body;

  // Validate input data
  if (!Array.isArray(ordersArr) || ordersArr.length === 0) {
    return res.status(400).send('Invalid input data');
  }

  const newOrderNumbers = ordersArr.map(order => order.orderNumber);

  const checkQuery = 'SELECT orderNumber FROM SatinOrders WHERE orderNumber IN (?)';

  pool.query(checkQuery, [newOrderNumbers], function (error, results) {
    if (error) {
      console.error('Error checking existing order numbers:', error);
      return res.status(500).send('Error checking existing order numbers');
    }

    // Extract existing order numbers from the results
    const existingOrderNumbers = results.map(row => row.orderNumber);
    console.log('Existing order numbers:', existingOrderNumbers);

    // Filter out orders with existing order numbers
    const ordersToInsert = ordersArr.filter(order => !existingOrderNumbers.includes(order.orderNumber.toString()));
    console.log('Orders to insert:', ordersToInsert);

    // If there are no orders to insert, return a message
    if (ordersToInsert.length === 0) {
      return res.status(200).send('No new orders to insert');
    }

    // Construct the insert query
    const insertQuery = `
    INSERT INTO SatinOrders (
      orderNumber, orderDate, type, customer_name, number_of_items, wedding_date, 
      pockets, items, reviewedItems, reviewStatus
    ) 
    VALUES ?`;

    // Map orders array to values array
    const values = ordersToInsert.map(order => {
      // Validate each order
      if (!order.orderNumber) {
        return res.status(400).send(`Invalid order data: missing orderNumber in order ${JSON.stringify(order)}`);
      }
      if (!order.orderDate) {
        return res.status(400).send(`Invalid order data: missing orderDate in order ${JSON.stringify(order)}`);
      }
      if (!order.type) {
        return res.status(400).send(`Invalid order data: missing type in order ${JSON.stringify(order)}`);
      }
      if (!order.customer_name) {
        return res.status(400).send(`Invalid order data: missing customer_name in order ${JSON.stringify(order)}`);
      }
      if (typeof order.number_of_items !== 'number') {
        return res.status(400).send(`Invalid order data: number_of_items must be a number in order ${JSON.stringify(order)}`);
      }

      // Ensure JSON objects are stringified
      const items = JSON.stringify(order.items || {});
      const reviewedItems = JSON.stringify(order.reviewedItems || {});

      return [
        order.orderNumber, order.orderDate, order.type, order.customer_name, order.number_of_items, order.wedding_date,
        order.pockets, items, reviewedItems, order.reviewStatus || ""
      ];
    });

    // Execute the SQL insert query
    pool.query(insertQuery, [values], function (error, results) {
      if (error) {
        console.error('Error inserting satin orders:', error);
        return res.status(500).send('Error inserting satin orders');
      } else {
        console.log('Satin Orders inserted successfully');
        return res.status(200).send('Satin Orders inserted successfully');
      }
    });
  });
});

//Endpoint to read orders
app.get('/getAllSatinOrders', function (req, res) {
  pool.query('SELECT * FROM SatinOrders', function (error, results) {
    if (error) {
      console.error('Error reading orders:', error);
      res.status(500).send('Error reading orders');
    } else {
      res.json(results);
    }
  });
});

app.delete('/deleteAllSatinOrders', function (req, res) {
  const deleteQuery = 'DELETE FROM SatinOrders';

  pool.query(deleteQuery, function (error, results) {
    if (error) {
      console.error('Error deleting satin orders:', error);
      return res.status(500).send('Error deleting satin orders');
    } else {
      console.log('All Satin Orders deleted successfully');
      return res.status(200).send('All Satin Orders deleted successfully');
    }
  });
});

app.get('/getSingleSatinOrder/:orderID', function (req, res) {
  const orderID = req.params.orderID;
  pool.query('SELECT * FROM SatinOrders WHERE orderNumber = ?', [orderID], function (error, results) {
    if (error) {
      res.status(500).send("Error fetching order: " + error);
    } else {
      res.send(results);
    }
  });
});

app.post('/updateSatinOrders', function (req, res) {
  const data = req.body;

  const failedOrders = [];

  let updatedOrdersCount = 0;

  data.forEach(order => {
    const orderId = order.orderNumber;


    const columnsToUpdate = Object.keys(order);
    const updateQuery = `UPDATE SatinOrders SET ${columnsToUpdate.map(column => `${column} = ?`).join(', ')} WHERE orderNumber = ?`;

    const updateValues = [...Object.values(order), orderId];

    console.log(updateQuery);

    pool.query(updateQuery, updateValues, function (error, results) {
      if (error) {
        console.error(`Error updating order ${orderId}:`, error);
        failedOrders.push(orderId);
      } else {
        if (results.affectedRows > 0) {
          updatedOrdersCount += results.affectedRows;
          console.log(`Order ${orderId} updated successfully`);
        } else {
          console.log(`Order ${orderId} does not exist in the database`);
          failedOrders.push(orderId);
        }
      }

      console.log("updated orders count " + updatedOrdersCount)
      if (updatedOrdersCount + failedOrders.length === data.length) {
        if (updatedOrdersCount > 0) {
          let responseMessage = `Updated ${updatedOrdersCount} orders successfully. `;
          if (failedOrders.length > 0) {
            responseMessage += `Failed to update orders: ${failedOrders.join(', ')}`;
          }
          res.json({
            status: "success",
            failedOrders: failedOrders
          })
        } else {
          res.json({
            status: "failed",
            failedOrders: failedOrders
          })
        }
      }
    });
  });
});

app.get('/readSatinByTypes', function (req, res) {
  const orderTypes = req.query.orderTypes.split(',');
  pool.query('SELECT * FROM SatinOrders WHERE reviewStatus = "" AND type IN (?)', [orderTypes], function (error, results) {
    if (error) {
      console.error('Error reading orders:', error);
      res.status(500).send("Error fetching order: " + error);
    } else {
      res.json(results);
    }
  });
});

app.delete('/deleteSingleSatinOrder/:orderID', function (req, res) {
  const orderID = req.params.orderID;
  pool.query('DELETE FROM SatinOrders WHERE orderNumber = ?', [orderID], function (error, results) {
    if (error) {
      res.status(500).send("Error deleting order: " + error);
    } else {
      // Check if any rows were affected (i.e., if the order was actually deleted)
      if (results.affectedRows > 0) {
        res.status(204).send("Order deleted: " + orderID);
      } else {
        res.status(404).send("Order not found: " + orderID);
      }
    }
  });
});

app.delete('/deleteUnifiedOrder/:orderID', function (req, res) {
  const orderID = req.params.orderID;
  pool.query('DELETE FROM UnifiedOrders WHERE Order_ID = ?', [orderID], function (error, results) {
    if (error) {
      res.status(500).send("Error deleting order: " + error);
    } else {
      // Check if any rows were affected (i.e., if the order was actually deleted)
      if (results.affectedRows > 0) {
        res.status(204).send("Order deleted: " + orderID);
      } else {
        res.status(404).send("Order not found: " + orderID);
      }
    }
  });
});

app.delete('/deleteUnifiedItem/:orderID', function (req, res) {
  const orderID = req.params.orderID;
  pool.query('DELETE FROM UnifiedItems WHERE Order_ID = ?', [orderID], function (error, results) {
    if (error) {
      res.status(500).send("Error deleting order: " + error);
    } else {
      // Check if any rows were affected (i.e., if the order was actually deleted)
      if (results.affectedRows > 0) {
        res.status(204).send("Order deleted: " + orderID);
      } else {
        res.status(404).send("Order not found: " + orderID);
      }
    }
  });
});

app.delete('/deleteFormOrder/:orderID', function (req, res) {
  const orderID = req.params.orderID;
  const type = req.query.type;

  if (!type) {
    return res.status(400).send("Missing required 'type' query parameter.");
  }

  pool.query(
    'DELETE FROM UnifiedForms WHERE Order_Number = ? AND Type = ?',
    [orderID, type],
    function (error, results) {
      if (error) {
        res.status(500).send("Error deleting form order: " + error.message);
      } else if (results.affectedRows > 0) {
        res.status(204).send();
      } else {
        res.status(404).send(`Order not found with ID: ${orderID} and Type: ${type}`);
      }
    }
  );
});

app.post('/alterTable/:tableName', function (req, res) {
  const tableName = req.params.tableName;
  const columns = req.body.columns;

  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    return res.status(400).send("Please provide an array of columns in the request body.");
  }

  const columnDefinitions = columns.map(column => `ADD COLUMN \`${column.name}\` ${column.type}`).join(", ");
  const query = `ALTER TABLE \`${tableName}\` ${columnDefinitions};`;

  console.log("Executing query:", query); 

  pool.query(query, function (error, results) {
    if (error) {
      res.status(500).send("Error altering table: " + error);
    } else {
      res.status(200).send(`Table "${tableName}" altered, columns added: ${columns.map(col => col.name).join(", ")}`);
    }
  });
});


app.get('/getTableSchema/:tableName', function (req, res) {
  const tableName = req.params.tableName;

  const query = `
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = ? 
    ORDER BY ordinal_position;reviewed
  `;

  pool.query(query, [tableName], function (error, results) {
    if (error) {
      res.status(500).send("Error fetching table schema: " + error);
    } else if (results.length === 0) {
      res.status(404).send(`Table "${tableName}" not found.`);
    } else {
      res.status(200).json(results);
    }
  });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



const newPromise = new Promise((res, reject) => {
  document.getElementById("button1").addEventListener('click', () => {
    res("resolved value")
  })
  document.getElementById("button2").addEventListener('click', () => {
    rej("value rejected")
  })
})

newPromise.then(res => console.log(res)).catch(err => { console.log(err) })
