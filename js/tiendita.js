const modalAdd = document.getElementById("addProducto");
const modalEdit = document.getElementById("editarProducto");
const modalAddCat = document.getElementById("addCategoria");
const modalEditCat = document.getElementById("editarCategoria");
const sidebar = document.getElementById("sidebar");

let productos = JSON.parse(localStorage.getItem("productos")) || [];
let categorias = JSON.parse(localStorage.getItem("categorias")) || [];

// Normalizar categorías en caso de existir datos previos como texto simple
categorias = categorias.map((c) =>
    typeof c === "string" ? { nombre: c, imagen: "" } : c
);

let filtroCategoria = "";

const btnSave = document.getElementById("btnSave");
const btnUpdate = document.getElementById("btnUpdate");
const btnSaveCat = document.getElementById("btnSaveCat");
const btnUpdateCat = document.getElementById("btnUpdateCat");


// CONFIGURACIÓN DE ALERTAS

const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
        confirmButton: "btn btn-success mx-3",
        cancelButton: "btn btn-danger"
    },
    buttonsStyling: false
});


// MENÚ LATERAL Y NAVEGACIÓN

document.getElementById("btnMenu").onclick = () => {
    sidebar.classList.toggle("d-none");
};

if (window.innerWidth < 768) {
    sidebar.classList.add("d-none");
}

const mostrarSeccion = (idSeccion, idMenu) => {
    if (idSeccion === "seccionProductos") {
        document.getElementById("seccionProductos").style.display = "";
        document.getElementById("seccionCategorias").style.display = "none";
    } else {
        document.getElementById("seccionProductos").style.display = "none";
        document.getElementById("seccionCategorias").style.display = "";
    }

    // Recalcular ancho de DataTables al cambiar de pestaña
    $.fn.dataTable.tables({ visible: true, api: true }).columns.adjust();

    document.querySelectorAll("#sidebar .nav-link").forEach((link) => {
        link.classList.remove("active");
    });
    document.getElementById(idMenu).classList.add("active");

    if (window.innerWidth < 768) {
        sidebar.classList.add("d-none");
    }
};


// CONVERTIR IMAGEN A BASE64

const convertirImagen = (archivo) => {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();

        lector.onload = () => resolve(lector.result);
        lector.onerror = () => reject("Error al cargar la imagen");

        lector.readAsDataURL(archivo);
    });
};


// SELECTS Y FILTRO DE CATEGORÍAS

const cargarFiltroCategorias = () => {
    let existe = false;
    let opciones = `<option value="">Todas</option>`;

    categorias.forEach((cat) => {
        let sel = "";
        if (cat.nombre === filtroCategoria) {
            sel = "selected";
            existe = true;
        }
        opciones += `<option value="${cat.nombre}" ${sel}>${cat.nombre}</option>`;
    });

    if (!existe) {
        filtroCategoria = "";
    }

    document.getElementById("filtroCategoria").innerHTML = opciones;
};

document.getElementById("filtroCategoria").onchange = function () {
    filtroCategoria = this.value;
    cargarProductos();
};

const cargarSelectCategorias = (idSelect, seleccionada = "") => {
    let opciones = `<option value="" disabled hidden ${seleccionada ? "" : "selected"}>Selecciona una categoría</option>`;

    categorias.forEach((cat) => {
        const sel = cat.nombre === seleccionada ? "selected" : "";
        opciones += `<option value="${cat.nombre}" ${sel}>${cat.nombre}</option>`;
    });

    document.getElementById(idSelect).innerHTML = opciones;
};


// ==========================================
// MÓDULO DE PRODUCTOS
// ==========================================

const abrirModalAgregarProducto = () => {
    if (categorias.length === 0) {
        Swal.fire({
            title: "SIN CATEGORÍAS",
            text: "Primero debes agregar al menos una categoría",
            icon: "warning"
        });
        return;
    }

    cargarSelectCategorias("categoria");
    modalAdd.showModal();
};


// VISTA PREVIA DE IMAGEN AL AGREGAR PRODUCTO

document.getElementById("imagen").onchange = async function () {
    const archivo = this.files[0];
    const vista = document.getElementById("vistaImagen");

    if (!archivo) {
        vista.style.display = "none";
        return;
    }

    if (!archivo.type.startsWith("image/")) {
        alert("Selecciona un archivo de imagen válido");
        this.value = "";
        vista.style.display = "none";
        return;
    }

    if (archivo.size > 1024 * 1024) {
        alert("La imagen no debe superar 1 MB");
        this.value = "";
        vista.style.display = "none";
        return;
    }

    vista.src = await convertirImagen(archivo);
    vista.style.display = "block";
};


// GUARDAR PRODUCTO

btnSave.onclick = async () => {
    const txtNombre = document.getElementById("nombre");
    const txtCategoria = document.getElementById("categoria");
    const txtPrecio = document.getElementById("precio");
    const txtStock = document.getElementById("stock");
    const txtImagen = document.getElementById("imagen");

    if (txtNombre.value.trim() == "" ||
        txtCategoria.value == "" ||
        txtPrecio.value == "" ||
        txtStock.value == "") {

        alert("ERROR: CAMPOS VACÍOS");
        return;
    }

    if (Number(txtPrecio.value) < 0 ||
        !Number.isFinite(Number(txtPrecio.value))) {

        alert("INGRESA UN PRECIO VÁLIDO");
        return;
    }

    if (!Number.isInteger(Number(txtStock.value)) ||
        Number(txtStock.value) < 0) {

        alert("INGRESA UNA CANTIDAD DE STOCK VÁLIDA");
        return;
    }

    let imagenBase64 = "";

    if (txtImagen.files[0]) {
        imagenBase64 = await convertirImagen(txtImagen.files[0]);
    }

    productos.push({
        nombre: txtNombre.value.trim(),
        categoria: txtCategoria.value,
        precio: txtPrecio.value,
        stock: Number(txtStock.value),
        imagen: imagenBase64
    });

    try {
        localStorage.setItem("productos", JSON.stringify(productos));

        txtNombre.value = "";
        txtCategoria.value = "";
        txtPrecio.value = "";
        txtStock.value = "";
        txtImagen.value = "";

        document.getElementById("vistaImagen").style.display = "none";

        modalAdd.close();
        cargarProductos();

    } catch (error) {
        productos.pop();
        alert("No hay espacio suficiente para guardar la imagen. Intenta con una imagen más pequeña.");
    }
};


// CARGAR PRODUCTOS EN LA TABLA (CON DATATABLES)

const cargarProductos = () => {
    if ($.fn.DataTable.isDataTable("#tablaProductos")) {
        $("#tablaProductos").DataTable().destroy();
    }

    productos = JSON.parse(localStorage.getItem("productos")) || [];

    const tbody = document.getElementById("productos");
    let tabla = "";

    productos.forEach((producto, posicion) => {
        if (producto.stock === undefined) producto.stock = 0;
        if (producto.imagen === undefined) producto.imagen = "";
        if (producto.categoria === undefined) producto.categoria = "";

        if (filtroCategoria !== "" && producto.categoria !== filtroCategoria) {
            return;
        }

        tabla += `
            <tr class="text-center">
                <td>
                    ${
                        producto.imagen
                        ? `<img src="${producto.imagen}" class="imagen-producto">`
                        : `<i class="bi bi-image text-secondary fs-2"></i>`
                    }
                </td>

                <td><b>${producto.nombre.toUpperCase()}</b></td>

                <td><b>${(producto.categoria || "SIN CATEGORÍA").toUpperCase()}</b></td>

                <td data-order="${producto.precio}"><b>$ ${parseFloat(producto.precio).toFixed(2)}</b></td>

                <td data-order="${producto.stock}"><b>${producto.stock} unidades</b></td>

                <td>
                    <button class="btn btn-danger btn-sm"
                    onclick="eliminarProducto(${posicion})">
                        <i class="bi bi-trash3"></i>
                    </button>

                    <button class="btn btn-warning btn-sm"
                    onclick="editarProducto(${posicion})">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = tabla;
    localStorage.setItem("productos", JSON.stringify(productos));

    $("#tablaProductos").DataTable({
        pageLength: 5,
        lengthMenu: [5, 10, 25, 50],
        columnDefs: [
            { orderable: false, targets: [0, 5] }
        ],
        layout: {
            topStart: {
                buttons: [
                    {
                        extend: "excelHtml5",
                        text: '<i class="bi bi-file-earmark-excel"></i> Excel',
                        title: "Productos",
                        exportOptions: { columns: [1, 2, 3, 4] }
                    },
                    {
                        extend: "pdfHtml5",
                        text: '<i class="bi bi-file-earmark-pdf"></i> PDF',
                        title: "Productos",
                        exportOptions: { columns: [1, 2, 3, 4] }
                    }
                ]
            }
        },
        language: {
            url: "https://cdn.datatables.net/plug-ins/2.1.8/i18n/es-ES.json"
        }
    });
};


// ELIMINAR PRODUCTO

const eliminarProducto = (posicion) => {
    swalWithBootstrapButtons.fire({
        title: "ELIMINAR PRODUCTO",
        text: "¿Estás seguro de eliminar este producto?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "SÍ, ELIMINAR",
        cancelButtonText: "CANCELAR",
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            productos.splice(posicion, 1);
            localStorage.setItem("productos", JSON.stringify(productos));
            cargarProductos();

            Swal.fire({
                title: "¡ÉXITO!",
                text: "El producto se eliminó correctamente",
                icon: "success"
            });
        }
    });
};


// EDITAR PRODUCTO

const editarProducto = (posicion) => {
    const producto = productos[posicion];

    cargarSelectCategorias("categoriae", producto.categoria);

    document.getElementById("nombree").value = producto.nombre;
    document.getElementById("precioe").value = producto.precio;
    document.getElementById("stocke").value = producto.stock ?? 0;
    document.getElementById("posicion").value = posicion;

    const vista = document.getElementById("vistaEditar");
    document.getElementById("imagene").value = "";

    if (producto.imagen) {
        vista.src = producto.imagen;
        vista.style.display = "block";
    } else {
        vista.style.display = "none";
    }

    modalEdit.showModal();
};


// VISTA PREVIA AL CAMBIAR IMAGEN DE PRODUCTO

document.getElementById("imagene").onchange = async function () {
    const archivo = this.files[0];
    const vista = document.getElementById("vistaEditar");

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
        alert("Selecciona una imagen válida");
        this.value = "";
        return;
    }

    if (archivo.size > 1024 * 1024) {
        alert("La imagen no debe superar 1 MB");
        this.value = "";
        return;
    }

    vista.src = await convertirImagen(archivo);
    vista.style.display = "block";
};


// ACTUALIZAR PRODUCTO

btnUpdate.onclick = async () => {
    const txtNombre = document.getElementById("nombree");
    const txtCategoria = document.getElementById("categoriae");
    const txtPrecio = document.getElementById("precioe");
    const txtStock = document.getElementById("stocke");
    const txtImagen = document.getElementById("imagene");

    const posicion = document.getElementById("posicion").value;

    if (txtNombre.value.trim() == "" ||
        txtCategoria.value == "" ||
        txtPrecio.value == "" ||
        txtStock.value == "") {

        alert("ERROR: CAMPOS VACÍOS");
        return;
    }

    if (Number(txtPrecio.value) < 0 ||
        !Number.isFinite(Number(txtPrecio.value))) {

        alert("INGRESA UN PRECIO VÁLIDO");
        return;
    }

    if (!Number.isInteger(Number(txtStock.value)) ||
        Number(txtStock.value) < 0) {

        alert("INGRESA UNA CANTIDAD DE STOCK VÁLIDA");
        return;
    }

    const productoAnterior = productos[posicion];
    const copiaAnterior = { ...productoAnterior };

    productos[posicion].nombre = txtNombre.value.trim();
    productos[posicion].categoria = txtCategoria.value;
    productos[posicion].precio = txtPrecio.value;
    productos[posicion].stock = Number(txtStock.value);

    if (txtImagen.files[0]) {
        productos[posicion].imagen = await convertirImagen(txtImagen.files[0]);
    }

    try {
        localStorage.setItem("productos", JSON.stringify(productos));

        modalEdit.close();

        txtNombre.value = "";
        txtCategoria.value = "";
        txtPrecio.value = "";
        txtStock.value = "";
        txtImagen.value = "";

        cargarProductos();

        Swal.fire({
            title: "¡ACTUALIZADO!",
            text: "Los cambios se guardaron correctamente",
            icon: "success"
        });

    } catch (error) {
        productos[posicion] = copiaAnterior;
        alert("No hay espacio suficiente para guardar los cambios. Intenta con una imagen más pequeña.");
    }
};


// ==========================================
// MÓDULO DE CATEGORÍAS
// ==========================================

// VISTA PREVIA AL AGREGAR CATEGORÍA

document.getElementById("imagenCat").onchange = async function () {
    const archivo = this.files[0];
    const vista = document.getElementById("vistaImagenCat");

    if (!archivo) {
        vista.style.display = "none";
        return;
    }

    if (!archivo.type.startsWith("image/")) {
        alert("Selecciona un archivo de imagen válido");
        this.value = "";
        vista.style.display = "none";
        return;
    }

    if (archivo.size > 1024 * 1024) {
        alert("La imagen no debe superar 1 MB");
        this.value = "";
        vista.style.display = "none";
        return;
    }

    vista.src = await convertirImagen(archivo);
    vista.style.display = "block";
};


// GUARDAR CATEGORÍA

btnSaveCat.onclick = async () => {
    const txtNombre = document.getElementById("nombreCat");
    const txtImagen = document.getElementById("imagenCat");
    const nombre = txtNombre.value.trim();

    if (nombre == "") {
        alert("ERROR: INGRESA EL NOMBRE DE LA CATEGORÍA");
        return;
    }

    const existe = categorias.some(
        (c) => c.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (existe) {
        alert("ESTA CATEGORÍA YA EXISTE");
        return;
    }

    let imagenBase64 = "";

    if (txtImagen.files[0]) {
        imagenBase64 = await convertirImagen(txtImagen.files[0]);
    }

    categorias.push({
        nombre: nombre,
        imagen: imagenBase64
    });

    try {
        localStorage.setItem("categorias", JSON.stringify(categorias));

        txtNombre.value = "";
        txtImagen.value = "";
        document.getElementById("vistaImagenCat").style.display = "none";

        modalAddCat.close();
        cargarCategorias();
        cargarFiltroCategorias();

    } catch (error) {
        categorias.pop();
        alert("No hay espacio suficiente para guardar la imagen. Intenta con una imagen más pequeña.");
    }
};


// CARGAR CATEGORÍAS EN LA TABLA (CON DATATABLES)

const cargarCategorias = () => {
    if ($.fn.DataTable.isDataTable("#tablaCategorias")) {
        $("#tablaCategorias").DataTable().destroy();
    }

    const tbody = document.getElementById("categorias");
    let tabla = "";

    categorias.forEach((cat, posicion) => {
        tabla += `
            <tr class="text-center">
                <td>
                    ${
                        cat.imagen
                        ? `<img src="${cat.imagen}" class="imagen-producto">`
                        : `<i class="bi bi-tags text-secondary fs-2"></i>`
                    }
                </td>

                <td><b>${cat.nombre.toUpperCase()}</b></td>

                <td>
                    <button class="btn btn-danger btn-sm"
                    onclick="eliminarCategoria(${posicion})">
                        <i class="bi bi-trash3"></i>
                    </button>

                    <button class="btn btn-warning btn-sm"
                    onclick="editarCategoria(${posicion})">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = tabla;
    localStorage.setItem("categorias", JSON.stringify(categorias));

    $("#tablaCategorias").DataTable({
        pageLength: 5,
        lengthMenu: [5, 10, 25, 50],
        columnDefs: [
            { orderable: false, targets: [0, 2] }
        ],
        layout: {
            topStart: {
                buttons: [
                    {
                        extend: "excelHtml5",
                        text: '<i class="bi bi-file-earmark-excel"></i> Excel',
                        title: "Categorias",
                        exportOptions: { columns: [1] }
                    },
                    {
                        extend: "pdfHtml5",
                        text: '<i class="bi bi-file-earmark-pdf"></i> PDF',
                        title: "Categorias",
                        exportOptions: { columns: [1] }
                    }
                ]
            }
        },
        language: {
            url: "https://cdn.datatables.net/plug-ins/2.1.8/i18n/es-ES.json"
        }
    });
};


// ELIMINAR CATEGORÍA

const eliminarCategoria = (posicion) => {
    const nombreCat = categorias[posicion].nombre;

    const tieneProductos = productos.some(
        (p) => p.categoria === nombreCat
    );

    if (tieneProductos) {
        Swal.fire({
            title: "NO SE PUEDE ELIMINAR",
            text: "Hay productos asignados a esta categoría",
            icon: "error"
        });
        return;
    }

    swalWithBootstrapButtons.fire({
        title: "ELIMINAR CATEGORÍA",
        text: "¿Estás seguro de eliminar esta categoría?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "SÍ, ELIMINAR",
        cancelButtonText: "CANCELAR",
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            categorias.splice(posicion, 1);
            localStorage.setItem("categorias", JSON.stringify(categorias));
            cargarCategorias();
            cargarFiltroCategorias();

            Swal.fire({
                title: "¡ÉXITO!",
                text: "La categoría se eliminó correctamente",
                icon: "success"
            });
        }
    });
};


// EDITAR CATEGORÍA

const editarCategoria = (posicion) => {
    const cat = categorias[posicion];

    document.getElementById("nombreCate").value = cat.nombre;
    document.getElementById("posicionCat").value = posicion;

    const vista = document.getElementById("vistaEditarCat");
    document.getElementById("imagenCate").value = "";

    if (cat.imagen) {
        vista.src = cat.imagen;
        vista.style.display = "block";
    } else {
        vista.style.display = "none";
    }

    modalEditCat.showModal();
};