
const modalAdd = document.getElementById("addProducto");
const modalEdit = document.getElementById("editarProducto");

let productos = JSON.parse(localStorage.getItem("productos")) || [];

const btnSave = document.getElementById("btnSave");

btnSave.onclick = () => {
    const txtNombre = document.getElementById("nombre");
    const txtPrecio = document.getElementById("precio");

    if (txtNombre.value == "" || txtPrecio.value == "") {
        alert("ERROR: CAMPOS VACIOS");
        return;
    }

    if (Number(txtPrecio.value) < 0 || !Number.isFinite(Number(txtPrecio.value))) {
        alert("INGRESA UN PRECIO VALIDO");
        return;
    }

    productos.push({
        nombre: txtNombre.value,
        precio: txtPrecio.value
    });

    localStorage.setItem("productos", JSON.stringify(productos));

    txtNombre.value = "";
    txtPrecio.value = "";

    modalAdd.close();
    cargarProductos();
};


const cargarProductos = () => {
    let posicion = 0;

    productos = JSON.parse(localStorage.getItem("productos")) || [];

    const tbody = document.getElementById("productos");
    var tabla = "";

    productos.map((producto) => {
        tabla += `<tr class="text-center">
            <td><b>${producto.nombre.toUpperCase()}</b></td>
            <td><b>$ ${parseFloat(producto.precio).toFixed(2)}</b></td>
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
        </tr>`;

        posicion++;
    });

    tbody.innerHTML = tabla;
};

cargarProductos();


const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
        confirmButton: "btn btn-success mx-3",
        cancelButton: "btn btn-danger"
    },
    buttonsStyling: false
});


const eliminarProducto = (posicion) => {
    swalWithBootstrapButtons.fire({
        title: "ELIMINAR PRODUCTO",
        text: "¿Estas seguro de eliminar este producto?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "SI, ELIMINAR",
        cancelButtonText: "CANCELAR",
        reverseButtons: true

    }).then((result) => {

        if (result.isConfirmed) {
            productos.splice(posicion, 1);

            localStorage.setItem("productos", JSON.stringify(productos));

            cargarProductos();

            Swal.fire({
                title: "¡EXITO!",
                text: "El producto se elimino correctamente",
                icon: "success"
            });
        }
    });
};


const editarProducto = (posicion) => {
    const producto = productos[posicion];

    document.getElementById("nombree").value = producto.nombre;
    document.getElementById("precioe").value = producto.precio;
    document.getElementById("posicion").value = posicion;

    modalEdit.showModal();
};


const btnUpdate = document.getElementById("btnUpdate");

btnUpdate.onclick = () => {
    const txtNombre = document.getElementById("nombree");
    const txtPrecio = document.getElementById("precioe");
    const posicion = document.getElementById("posicion");

    if (txtNombre.value == "" || txtPrecio.value == "") {
        alert("ERROR: CAMPOS VACIOS");
        return;
    }

    if (Number(txtPrecio.value) < 0 || !Number.isFinite(Number(txtPrecio.value))) {
        alert("INGRESA UN PRECIO VALIDO");
        return;
    }

    productos[posicion.value].nombre = txtNombre.value;
    productos[posicion.value].precio = txtPrecio.value;

    localStorage.setItem("productos", JSON.stringify(productos));

    modalEdit.close();

    txtNombre.value = "";
    txtPrecio.value = "";

    cargarProductos();

    Swal.fire({
        title: "¡ACTUALIZADO!",
        text: "Los cambios se guardaron correctamente",
        icon: "success"
    });
};
