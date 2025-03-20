/* global XLSX */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("excel-file").addEventListener("change", handleFile, false)
  document.getElementById("product-form").addEventListener("submit", addProduct)
  document.getElementById("product-select").addEventListener("change", updateProductDetails)
  document.getElementById("load-invoice-file").addEventListener("change", loadInvoiceFromExcel, false)

  // Agregar evento para el botón de ajuste (abono o descuento)
  document.getElementById("add-adjustment-btn").addEventListener("click", addAdjustment)

  // Cargar automáticamente el archivo Excel
  setTimeout(() => {
    document.getElementById("excel-file").click()
  }, 500)
})

// Función para asegurar que los checkboxes de condiciones de pago se visualicen correctamente
function updatePaymentMethodVisibility() {
  const contadoCheckbox = document.getElementById("contado")
  const creditoCheckbox = document.getElementById("credito")

  // Aplicar estilos directamente para forzar la visualización correcta
  if (contadoCheckbox.checked) {
    contadoCheckbox.setAttribute("checked", "checked")
  } else {
    contadoCheckbox.removeAttribute("checked")
  }

  if (creditoCheckbox.checked) {
    creditoCheckbox.setAttribute("checked", "checked")
  } else {
    creditoCheckbox.removeAttribute("checked")
  }
}

// Agregar eventos para los checkboxes de condiciones de pago
document.addEventListener("DOMContentLoaded", () => {
  const contadoCheckbox = document.getElementById("contado")
  const creditoCheckbox = document.getElementById("credito")

  contadoCheckbox.addEventListener("change", updatePaymentMethodVisibility)
  creditoCheckbox.addEventListener("change", updatePaymentMethodVisibility)
})

let products = []
let productList = []

function addProduct(e) {
  e.preventDefault()
  const quantity = document.getElementById("product-quantity").value
  const description = document.getElementById("product-description").value
  const price = document.getElementById("product-price").value
  const total = (quantity * price).toFixed(2)

  products.push({ quantity, description, price, total })
  updateInvoiceTable()
  updateTotals()

  // Limpiar formulario
  document.getElementById("product-form").reset()
}

function updateInvoiceTable() {
  const tbody = document.getElementById("invoice-items")
  tbody.innerHTML = ""
  products.forEach((product, index) => {
    const row = tbody.insertRow()
    row.innerHTML = `
            <td>${product.quantity}</td>
            <td>${product.description}</td>
            <td>$${Number.parseFloat(product.price).toFixed(2)}</td>
            <td>$${product.total}</td>
            <td class="no-print">
                <button class="action-btn" onclick="editProduct(${index})">Editar</button>
                <button class="action-btn delete-btn" onclick="deleteProduct(${index})">Eliminar</button>
            </td>
        `
  })
}

function editProduct(index) {
  const product = products[index]
  document.getElementById("product-quantity").value = product.quantity
  document.getElementById("product-description").value = product.description
  document.getElementById("product-price").value = product.price

  // Encontrar y seleccionar el producto en el desplegable
  const select = document.getElementById("product-select")
  const option = Array.from(select.options).find((option) => option.textContent === product.description)
  if (option) {
    select.value = option.value
  }

  // Eliminar el producto de la lista
  products.splice(index, 1)
  updateInvoiceTable()
  updateTotals()
}

function deleteProduct(index) {
  products.splice(index, 1)
  updateInvoiceTable()
  updateTotals()
}

function addAdjustment() {
  const adjustmentType = document.getElementById("adjustment-type").value
  const adjustmentAmount = Number.parseFloat(document.getElementById("adjustment-amount").value)

  if (!adjustmentType) {
    alert("Por favor seleccione un tipo de ajuste (Descuento o Abono)")
    return
  }

  if (isNaN(adjustmentAmount) || adjustmentAmount < 0) {
    alert("Por favor ingrese un monto válido")
    return
  }

  if (adjustmentType === "discount") {
    const currentDiscount = Number.parseFloat(document.getElementById("discount").textContent)
    document.getElementById("discount").textContent = (currentDiscount + adjustmentAmount).toFixed(2)
  } else if (adjustmentType === "deposit") {
    const currentDeposit = Number.parseFloat(document.getElementById("deposit").textContent)
    document.getElementById("deposit").textContent = (currentDeposit + adjustmentAmount).toFixed(2)
  }

  // Resetear el formulario de ajuste
  document.getElementById("adjustment-type").value = ""
  document.getElementById("adjustment-amount").value = "0.00"

  updateTotals()
}

// Modificar la función updateTotals para manejar correctamente los valores de abono y descuento
function updateTotals() {
  const subtotal = products.reduce((sum, product) => sum + Number(product.total), 0)
  const tax = (subtotal * 0.07).toFixed(2) // Redondear el 7% ITBMS a 2 decimales

  // Corregir la conversión de los valores de depósito y descuento
  const depositElement = document.getElementById("deposit")
  const discountElement = document.getElementById("discount")

  const deposit = depositElement && depositElement.textContent ? Number.parseFloat(depositElement.textContent) || 0 : 0
  const discount =
    discountElement && discountElement.textContent ? Number.parseFloat(discountElement.textContent) || 0 : 0

  // El total es subtotal + impuesto - descuento - abono
  const total = (subtotal + Number(tax) - discount - deposit).toFixed(2) // Redondear el total a 2 decimales

  document.getElementById("subtotal").textContent = subtotal.toFixed(2)
  document.getElementById("tax").textContent = tax
  document.getElementById("total").textContent = total
}

// Nueva función para agregar abono
function addDeposit() {
  const depositAmount = prompt("Ingrese el monto del abono:", "0.00")
  if (depositAmount !== null) {
    const amount = Number.parseFloat(depositAmount)
    if (!isNaN(amount) && amount >= 0) {
      document.getElementById("deposit").textContent = amount.toFixed(2)
      updateTotals()
    } else {
      alert("Por favor ingrese un monto válido")
    }
  }
}

// Nueva función para agregar descuento
function addDiscount() {
  const discountAmount = prompt("Ingrese el monto del descuento:", "0.00")
  if (discountAmount !== null) {
    const amount = Number.parseFloat(discountAmount)
    if (!isNaN(amount) && amount >= 0) {
      document.getElementById("discount").textContent = amount.toFixed(2)
      updateTotals()
    } else {
      alert("Por favor ingrese un monto válido")
    }
  }
}

function handleFile(e) {
  const file = e.target.files[0]
  if (!file) return // Si no hay archivo seleccionado, salir de la función

  const reader = new FileReader()
  reader.onload = (e) => {
    /* global XLSX */
    if (typeof XLSX === "undefined") {
      console.error("XLSX is not defined. Make sure the library is loaded.")
      return
    }
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: "array" })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const json = XLSX.utils.sheet_to_json(worksheet)

    // Asegurarse de que cada producto tenga una categoría
    const productsWithCategories = json.slice(1).map((product) => {
      if (!product.Category) {
        product.Category = "Sin Categoría"
      }
      return product
    })

    populateInvoice(json[0]) // Asumiendo que la primera fila contiene los datos de la factura
    loadProductList(productsWithCategories) // Cargar productos con categorías
  }
  reader.readAsArrayBuffer(file)
}

function populateInvoice(data) {
  //document.getElementById("invoice-date").value = data.Date || ""

  // Agregar la fecha actual
  const currentDate = new Date().toISOString().split("T")[0] // Formato YYYY-MM-DD
  document.getElementById("invoice-date").value = currentDate

  document.getElementById("client-name").value = data.Client || ""
  document.getElementById("client-address").value = data.Address || ""
  document.getElementById("client-phone").value = data.Phone || ""
  document.getElementById("client-email").value = data.Email || ""
  document.getElementById("seller-name").value = data.Seller || ""
  document.getElementById("order-number").value = data.OrderNumber || ""
  document.getElementById("contado").checked = data.Contado === "true"
  document.getElementById("credito").checked = data.Credito === "true"
  document.getElementById("deposit").textContent = data.Deposit || "0.00"
  document.getElementById("discount").textContent = data.Discount || "0.00"

  products = []
  updateInvoiceTable()
  updateTotals()
}

// Modificar la función loadProductList para agrupar productos por categoría
function loadProductList(productData) {
  productList = productData

  // Extraer categorías únicas de los productos
  const categories = [...new Set(productData.map((product) => product.Category || "Sin Categoría"))]

  // Crear el selector de categorías
  const categorySelect = document.createElement("select")
  categorySelect.id = "category-select"
  categorySelect.innerHTML = '<option value="">Todas las categorías</option>'

  categories.forEach((category) => {
    const option = document.createElement("option")
    option.value = category
    option.textContent = category
    categorySelect.appendChild(option)
  })

  // Insertar el selector de categorías antes del selector de productos
  const productForm = document.getElementById("product-form")
  const productSelect = document.getElementById("product-select")
  productForm.insertBefore(categorySelect, productSelect)

  // Agregar evento para filtrar productos por categoría
  categorySelect.addEventListener("change", filterProductsByCategory)

  // Inicializar el selector de productos
  updateProductSelect(productData)
}

// Nueva función para actualizar el selector de productos
function updateProductSelect(filteredProducts) {
  const select = document.getElementById("product-select")
  select.innerHTML = '<option value="">Seleccione un producto</option>'

  // Sort the products alphabetically by description
  const sortedProducts = [...filteredProducts].sort((a, b) =>
    a.Description.localeCompare(b.Description, "es", { sensitivity: "base" }),
  )

  sortedProducts.forEach((product, index) => {
    const option = document.createElement("option")
    option.value = index
    option.textContent = product.Description
    option.dataset.originalIndex = productList.indexOf(product) // Guardar el índice original
    select.appendChild(option)
  })
}

// Nueva función para filtrar productos por categoría
function filterProductsByCategory() {
  const categorySelect = document.getElementById("category-select")
  const selectedCategory = categorySelect.value

  let filteredProducts
  if (selectedCategory === "") {
    // Si no hay categoría seleccionada, mostrar todos los productos
    filteredProducts = productList
  } else {
    // Filtrar productos por la categoría seleccionada
    filteredProducts = productList.filter((product) => (product.Category || "Sin Categoría") === selectedCategory)
  }

  updateProductSelect(filteredProducts)
}

// Modificar la función updateProductDetails para usar el índice original
function updateProductDetails() {
  const select = document.getElementById("product-select")
  const selectedOption = select.options[select.selectedIndex]

  if (select.value !== "") {
    // Usar el índice original almacenado en el dataset
    const originalIndex = selectedOption.dataset.originalIndex
    const selectedProduct = productList[originalIndex]

    document.getElementById("product-description").value = selectedProduct.Description
    document.getElementById("product-price").value = selectedProduct.Price
  } else {
    document.getElementById("product-description").value = ""
    document.getElementById("product-price").value = ""
  }
}

function printInvoice() {
  window.print()
}

function updateTotal() {
  updateTotals()
}

function saveInvoice() {
  const invoiceData = {
    date: document.getElementById("invoice-date").value,
    clientName: document.getElementById("client-name").value,
    clientAddress: document.getElementById("client-address").value,
    clientPhone: document.getElementById("client-phone").value,
    clientEmail: document.getElementById("client-email").value,
    sellerName: document.getElementById("seller-name").value,
    orderNumber: document.getElementById("order-number").value,
    contado: document.getElementById("contado").checked,
    credito: document.getElementById("credito").checked,
    deposit: document.getElementById("deposit").textContent,
    discount: document.getElementById("discount").textContent,
    products: products,
  }

  const invoiceJson = JSON.stringify(invoiceData)
  localStorage.setItem("savedInvoice", invoiceJson)
  alert("Factura guardada correctamente")
}

function loadInvoice() {
  const savedInvoice = localStorage.getItem("savedInvoice")
  if (savedInvoice) {
    const invoiceData = JSON.parse(savedInvoice)
    document.getElementById("invoice-date").value = invoiceData.date
    document.getElementById("client-name").value = invoiceData.clientName
    document.getElementById("client-address").value = invoiceData.clientAddress
    document.getElementById("client-phone").value = invoiceData.clientPhone
    document.getElementById("client-email").value = invoiceData.clientEmail
    document.getElementById("seller-name").value = invoiceData.sellerName
    document.getElementById("order-number").value = invoiceData.orderNumber
    document.getElementById("contado").checked = invoiceData.contado
    document.getElementById("credito").checked = invoiceData.credito
    document.getElementById("deposit").textContent = invoiceData.deposit
    document.getElementById("discount").textContent = invoiceData.discount || "0.00"

    products = invoiceData.products.map((product) => ({
      ...product,
      total: (Number(product.quantity) * Number(product.price)).toFixed(2),
    }))

    updateInvoiceTable()
    updateTotals()
    alert("Factura cargada correctamente")
  } else {
    alert("No hay factura guardada")
  }
}

function saveInvoiceToExcel() {
  const orderNumber = document.getElementById("order-number").value || "SinNumero"
  const clientName = document.getElementById("client-name").value || "Cliente"

  const invoiceData = [
    ["Fecha", document.getElementById("invoice-date").value],
    ["Cliente", clientName],
    ["Dirección", document.getElementById("client-address").value],
    ["Teléfono", document.getElementById("client-phone").value],
    ["Correo", document.getElementById("client-email").value],
    ["Vendedor", document.getElementById("seller-name").value],
    ["Orden de Entrega", orderNumber],
    ["Contado", document.getElementById("contado").checked],
    ["Crédito", document.getElementById("credito").checked],
    ["Abono", document.getElementById("deposit").textContent],
    ["Descuento", document.getElementById("discount").textContent],
    [],
    ["Cantidad", "Descripción", "Precio Unitario", "Total"],
  ]

  // Filtrar productos con cantidad o precio en cero
  const validProducts = products.filter((product) => {
    const quantity = Number.parseFloat(product.quantity)
    const price = Number.parseFloat(product.price)
    return quantity > 0 && price > 0 && product.description && product.description.trim() !== ""
  })

  validProducts.forEach((product) => {
    invoiceData.push([product.quantity, product.description, product.price, product.total])
  })

  const ws = XLSX.utils.aoa_to_sheet(invoiceData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Factura")

  // Crear un nombre de archivo con el número de orden y el nombre del cliente
  const sanitizedClientName = clientName.replace(/[\\/:*?"<>|]/g, "_").substring(0, 30) // Eliminar caracteres no válidos para nombre de archivo
  const fileName = `Factura_${orderNumber}_${sanitizedClientName}.xlsx`
  XLSX.writeFile(wb, fileName)
}

function loadInvoiceFromExcel(e) {
  const file = e.target.files[0]
  if (!file) return // Si no hay archivo seleccionado, salir de la función

  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: "array" })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    // Rellenar los campos de la factura
    document.getElementById("invoice-date").value = json[0][1] || ""
    document.getElementById("client-name").value = json[1][1] || ""
    document.getElementById("client-address").value = json[2][1] || ""
    document.getElementById("client-phone").value = json[3][1] || ""
    document.getElementById("client-email").value = json[4][1] || ""
    document.getElementById("seller-name").value = json[5][1] || ""
    document.getElementById("order-number").value = json[6][1] || ""
    document.getElementById("order-number-text").textContent = json[6][1] || ""
    document.getElementById("contado").checked = json[7][1] === "true"
    document.getElementById("credito").checked = json[8][1] === "true"

    // Reemplazar la sección en loadInvoiceFromExcel donde se manejan los checkboxes con este código más robusto:

    // Asegurar que las opciones de pago se visualicen correctamente
    const contadoValue = String(json[7][1]).toLowerCase()
    const creditoValue = String(json[8][1]).toLowerCase()

    // Establecer los valores de los checkboxes
    const contadoCheckbox = document.getElementById("contado")
    const creditoCheckbox = document.getElementById("credito")

    // Convertir cualquier valor a booleano de manera más robusta
    contadoCheckbox.checked =
      contadoValue === "true" || contadoValue === "1" || contadoValue === "yes" || contadoValue === "sí"
    creditoCheckbox.checked =
      creditoValue === "true" || creditoValue === "1" || creditoValue === "yes" || creditoValue === "sí"

    // Forzar actualización visual de los checkboxes
    setTimeout(() => {
      // Aplicar estilos directamente si es necesario
      if (contadoCheckbox.checked) {
        contadoCheckbox.setAttribute("checked", "checked")
      } else {
        contadoCheckbox.removeAttribute("checked")
      }

      if (creditoCheckbox.checked) {
        creditoCheckbox.setAttribute("checked", "checked")
      } else {
        creditoCheckbox.removeAttribute("checked")
      }

      // Disparar eventos para asegurar que cualquier listener de eventos reaccione
      contadoCheckbox.dispatchEvent(new Event("change", { bubbles: true }))
      creditoCheckbox.dispatchEvent(new Event("change", { bubbles: true }))
    }, 100)

    // Asegurar que los valores de depósito y descuento sean números válidos
    document.getElementById("deposit").textContent = Number.parseFloat(json[9][1] || 0).toFixed(2)
    document.getElementById("discount").textContent = Number.parseFloat(json[10][1] || 0).toFixed(2)

    // Cargar productos
    products = []

    // Empezar desde la fila 13 (índice 12) para evitar la fila de encabezados
    for (let i = 13; i < json.length; i++) {
      // Verificar que la fila tenga suficientes datos y no sea la fila de encabezados
      if (json[i] && json[i].length >= 4) {
        // Verificar que la cantidad y el precio sean números válidos mayores que 0
        const quantity = Number.parseFloat(json[i][0])
        const description = String(json[i][1] || "").trim()
        const price = Number.parseFloat(json[i][2])

        // Solo agregar si todos los valores son válidos
        if (
          !isNaN(quantity) &&
          quantity > 0 &&
          description &&
          description !== "" &&
          description.toLowerCase() !== "descripción" &&
          !isNaN(price) &&
          price > 0
        ) {
          const total = (quantity * price).toFixed(2)

          products.push({
            quantity: quantity,
            description: description,
            price: price,
            total: total,
          })
        }
      }
    }

    updateInvoiceTable()
    updateTotals()
    alert("Factura cargada correctamente desde Excel")
  }
  reader.readAsArrayBuffer(file)
}

// Agregar estas nuevas funciones al final del archivo

function editAdjustment(type) {
  const currentValue = Number(document.getElementById(type).textContent)
  const newValue = prompt(`Editar ${type === "deposit" ? "abono" : "descuento"}:`, currentValue.toFixed(2))

  if (newValue !== null) {
    const amount = Number.parseFloat(newValue)
    if (!isNaN(amount) && amount >= 0) {
      document.getElementById(type).textContent = amount.toFixed(2)
      updateTotals()
    } else {
      alert("Por favor ingrese un monto válido")
    }
  }
}

function deleteAdjustment(type) {
  if (confirm(`¿Está seguro que desea eliminar el ${type === "deposit" ? "abono" : "descuento"}?`)) {
    document.getElementById(type).textContent = "0.00"
    updateTotals()
  }
}

// Asegurar que XLSX esté disponible globalmente para operaciones de Excel
/* global XLSX */
if (typeof XLSX === "undefined") {
  console.warn("La biblioteca XLSX no está cargada. La funcionalidad de Excel podría no funcionar.")
}

