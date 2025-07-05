const express = require('express');
const app = express();
const mysql = require("mysql");
const session = require('express-session');
app.use(express.urlencoded({ extended: true }));


// Conexión a MySQL
const conexion = mysql.createConnection({
  host: "localhost",
  database: "tienda",
  user: "root",
  password: ""
});
app.use(session({
  secret: 'mi_clave_secreta',
  resave: false,
  saveUninitialized: true
}));


conexion.connect(function(error) {
  if (error) {
    console.log("Error al conectar a la base de datos:", error);
    return;
  }
  console.log("Conexión exitosa a la base de datos MySQL");
});

//direcciones
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended:false}));


app.use(express.static('public'));



//funcion para agregar proveedor
app.get('/agregar_proveedor', (req, res) => {
  res.render('agregar_proveedor');
});
app.post("/validar", function(req,res){
  const datos = req.body;
  let cedula = datos.id;
  let nombre = datos.nom;
  let telefono = datos.tel;
  let direccion = datos.direccion;
  let buscar = "SELECT * FROM proveedor WHERE idProveedor = "+cedula+" ";
  conexion.query(buscar, function(error,row){
    if(error){
      throw error;
    }else{
      if(row.length>0){
         res.render('agregar_proveedor', { mensaje: 'Proveedor existente' });
        console.log("usuario existente");
      }else{

          let registrar = "INSERT INTO proveedor(idProveedor, nombre, contacto, direccion) VALUES ('"+cedula+"','"+nombre+"','"+telefono+"','"+direccion+"')"
  conexion.query(registrar,function(error){
    if(error){
      throw error;
    }else{
      res.redirect('/proveedores');
    }
  });
        
      }

    }
    
  })

});
//consulta para buscar proveedor
app.get('/buscar_proveedor', (req, res) => {
  const dato = req.query.dato;

  const consulta = `
    SELECT * FROM proveedor
    WHERE 
      idProveedor LIKE ? OR 
      nombre LIKE ? OR 
      contacto LIKE ? OR 
      direccion LIKE ?
  `;

  const datoConPorcentaje = `%${dato}%`;

  conexion.query(consulta, [datoConPorcentaje, datoConPorcentaje, datoConPorcentaje, datoConPorcentaje], (err, resultados) => {
    if (err) {
throw err;
    }else{
if(resultados.length > 0){
    res.render('proveedores', { proveedores: resultados });
   }else{
     res.render('proveedores', {proveedores: [], texto: 'Proveedor NO existente' });
   }
   }
  });
});

//mostrar proveedores
app.get('/proveedores', (req, res) => {
  conexion.query('SELECT * FROM proveedor', (err, resultados) => {
    if (err) throw err;
    res.render('proveedores', { proveedores: resultados });
  });
});
//agregar categoria
app.get('/agregar_categoria', (req, res) => {
  res.render('agregar_categoria');
});

app.post("/categoria", function(req,res){
  const datos = req.body;
  let nombre = datos.nom;
  let agregar = "INSERT INTO categoria(id_categoria, nombre) VALUES ('','"+nombre+"')"
  conexion.query(agregar, function(error){
    if(error){
      throw error;
    }else{
      console.log("categoria agregada");

    }
  })
});
//buscar categoria
app.get('/buscar_categoria', (req, res) => {
  const dato = req.query.dato;

  const consulta = `
    SELECT * FROM categoria
    WHERE 
      id_categoria LIKE ? OR 
      nombre LIKE ?  
      
  `;

  const datoConPorcentaje = `%${dato}%`;

  conexion.query(consulta, [datoConPorcentaje, datoConPorcentaje, ], (err, resultados) => {
    if (err) {
throw err;
    }else{
if(resultados.length > 0){
    res.render('categoria', { categoria: resultados });
   }else{
     res.render('categoria', {categoria: [], texto: 'Categoria NO existente' });
   }
   }
  });
});
//mostrar categorias
app.get('/categoria', (req, res) => {
  conexion.query('SELECT * FROM categoria', (err, resultados) => {
    if (err) throw err;
    res.render('categoria', { categoria: resultados });
  });
});

// Solo carga la vista sin productos
app.get('/productos', (req, res) => {
  res.render('productos', { productos: [], texto: null });
});

//  búsqueda de productos



app.get('/buscar_producto', (req, res) => {
  const dato = req.query.dato;
  const datoConPorcentaje = `%${dato}%`;

  const consulta = `
    SELECT * FROM producto
    WHERE idProducto LIKE ? OR nombre LIKE ?
  `;

  conexion.query(consulta, [datoConPorcentaje, datoConPorcentaje], (err, resultados) => {
    if (err) throw err;

    resultados.forEach(p => {
            p.fecha_vencimiento_formateada = new Date(p.fecha_vencimiento).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            });
          });


     
    if (resultados.length > 0) {
      res.render('productos', { productos: resultados });
    } else {
      res.render('productos', { productos: [], texto: 'No se encontraron productos.' });
    }
  });
});
//agregar productos
app.get('/agregar_productos', (req, res) => {
  res.render('agregar_productos');
});
app.post("/agregar_productos", function(req,res){
  const datos = req.body;
  let nombre = datos.nom;
  let fecha = datos.fecha;
  let categoria = datos.categoria;
  let  precio = parseFloat(req.body.compra);
  let  porcentaje = parseFloat(req.body.porcentaje);
  let precio_venta = precio +(precio * porcentaje/100);
  let cantidad_actual = parseInt(datos.cantidad_actual);
  let cantidad_minima = datos.cantidad_minima;
  let proveedor = datos.proveedor;
  let buscar = "SELECT * FROM producto WHERE LOWER(nombre) = LOWER('"+nombre+"') ";
  conexion.query(buscar, function(error,row){
    if(error){
      throw error;
    }else{
      if(row.length>0){
         const cantidadExistente = row[0].stockActual;
      const nuevaCantidad = cantidadExistente + parseInt(cantidad_actual);
      //actualizar solo la cantidad 
       conexion.query(
        "UPDATE producto SET stockActual = '"+nuevaCantidad+"' WHERE LOWER(nombre)= LOWER('"+nombre+"')",
      
        (err, result) => {
          if (err) throw err;
          res.redirect('/productos');
        }
      );
      //agregar producto si no existe
      }else{
         let buscarCategoria = `
    SELECT 
      categoria.id_categoria, 
      categoria.nombre AS nombreCategoria 
    FROM categoria 
    WHERE categoria.nombre = ?
  `;

  conexion.query(buscarCategoria, [categoria], (error, resultadoCategoria) => {
    if (error) return res.send("Error en consulta: " + error);
    if (resultadoCategoria.length === 0) return res.send("Categoría no existe.");

    const idCategoria = resultadoCategoria[0].id_categoria;

    let buscarProveedor = `
      SELECT 
        proveedor.idProveedor, 
        proveedor.nombre AS nombreProveedor 
      FROM proveedor 
      WHERE proveedor.nombre = ?
    `;

    conexion.query(buscarProveedor, [proveedor], (error, resultadoProveedor) => {
      if (error) return res.send("Error en consulta: " + error);
      if (resultadoProveedor.length === 0) return res.send("Proveedor no existe.");

      const idProveedor = resultadoProveedor[0].idProveedor;

      let registrar = `
        INSERT INTO producto 
        (nombre, fecha_vencimiento, IDcategoria, precioCompra, precioVenta, stockActual, stockMinimo, idProveedor) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      conexion.query(registrar, [nombre, fecha, idCategoria, precio, precio_venta, cantidad_actual, cantidad_minima, idProveedor], (error) => {
        if (error) {
          return res.send("Error al registrar producto: " + error);
        } else {
          res.redirect('/productos');
        }
      });
    });
  });
        
      }

    }
    
  })

});



//nueva factura

// RUTAS DE VISTAS
// Rutas principales
app.get('/factura_venta', (req, res) => res.render('factura_venta'));
app.get('/tipo', (req, res) => res.render('tipo'));
app.get('/salida', (req, res) => res.render('salida'));

// PROCESAR FORMULARIO DE TIPO
app.post("/tipo", (req, res) => {
  const tipo = req.body.tipo.toLowerCase();

  if (tipo === "venta") {
    req.session.tipo = "venta";
    return res.redirect("/factura_venta");
  } else if (tipo === "compra") {
    req.session.tipo = "compra";
    return res.redirect("/salida");
  } else {
    return res.send("Tipo inválido");
  }
});

// FORMULARIO DE FACTURA (VENTA)
app.post("/factura", (req, res) => {
  const datos = req.body;
  const tipo = req.session.tipo;
  const nombre = datos.producto;
  const cantidad = parseInt(datos.cantidad);
  const fecha = datos.fecha;
  const observacion = datos.observaciones;

  if (!req.session.carrito_venta) req.session.carrito_venta = [];

  const consulta = "SELECT idProducto, nombre, precioVenta, stockActual FROM producto WHERE nombre = ?";
  conexion.query(consulta, [nombre], (error, resultado) => {
    if (error) return res.send("Error en consulta: " + error);
    if (resultado.length === 0) return res.send("Producto no encontrado");

    const producto = resultado[0];

    if (producto.stockActual < cantidad) {
      return res.send("No hay suficiente stock disponible. Solo hay " + producto.stockActual);
    }

    req.session.carrito_venta.push({
      tipo,
      idProducto: producto.idProducto,
      nombre: producto.nombre,
      cantidad,
      precio: producto.precioVenta,
      subtotal: cantidad * producto.precioVenta,
      fecha,
      observacion
    });

    res.redirect("/confirmacion");
  });
});

// FORMULARIO DE SALIDA (COMPRA)
app.post("/salida", (req, res) => {
  const { cantidad, provee: proveedor, produc: producto, descripcion } = req.body;
  const tipo = req.session.tipo;

  if (!cantidad || !proveedor || !producto) {
    return res.send("Todos los campos son obligatorios.");
  }

  const cantidadInt = parseInt(cantidad);
  if (isNaN(cantidadInt) || cantidadInt <= 0) {
    return res.send("Cantidad inválida.");
  }

  if (!req.session.carrito_compra) req.session.carrito_compra = [];

  const consulta = `
    SELECT 
      producto.idProducto, 
      producto.nombre AS nombreProducto, 
      proveedor.idProveedor, 
      proveedor.nombre AS nombreProveedor
    FROM producto 
    JOIN proveedor ON producto.idProveedor = proveedor.idProveedor
    WHERE producto.nombre = ? AND proveedor.nombre = ?
  `;

  conexion.query(consulta, [producto, proveedor], (error, resultado) => {
    if (error) return res.send("Error en consulta: " + error);
    if (resultado.length === 0) return res.send("Producto o proveedor no existe.");

    const datosProducto = resultado[0];
    const fecha = new Date().toLocaleDateString('sv-SE')

    req.session.carrito_compra.push({
      tipo,
      fecha,
      cantidad: cantidadInt,
      proveedor,
      id_proveedor: datosProducto.idProveedor,
      producto,
      idProducto: datosProducto.idProducto,
      descripcion
    });

    res.redirect("/salidaConfirmacion");
  });
});

// VISTA DE CONFIRMACIÓN DE VENTA
app.get("/confirmacion", (req, res) => {
  const carrito = req.session.carrito_venta || [];
  let total = carrito.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  res.render("confirmacion", { carrito, total });
});

// VISTA DE CONFIRMACIÓN DE COMPRA
app.get("/salidaConfirmacion", (req, res) => {
  const carrito = req.session.carrito_compra || [];
  const total = carrito.reduce((suma, item) => suma + item.cantidad, 0);
  res.render("salidaConfirmacion", { carrito, total });
});

// GUARDAR EN BD
app.post("/finalizar_factura", (req, res) => {
  const carrito_venta = req.session.carrito_venta || [];
  const carrito_compra = req.session.carrito_compra || [];

  if (carrito_venta.length === 0 && carrito_compra.length === 0) {
    return res.send("El carrito está vacío");
  }

  if (carrito_venta.length > 0) {
    carrito_venta.forEach(item => {
      const insertar = "INSERT INTO movimiento (tipo, idProducto, cantidad, fecha, observaciones, precio) VALUES (?, ?, ?, ?, ?, ?)";
      conexion.query(insertar, [item.tipo, item.idProducto, item.cantidad, item.fecha, item.observacion,  item.subtotal], err => {
        if (err) console.error("Error al insertar en movimiento:", err);
      });
    });
    req.session.carrito_venta = [];
    return res.redirect("/factura_venta");
  }

  if (carrito_compra.length > 0) {
    carrito_compra.forEach(item => {
      const insertar = "INSERT INTO salida (fecha, valor, idProveedor, idProducto, descripcion) VALUES (?, ?, ?, ?, ?)";
      conexion.query(insertar, [item.fecha, item.cantidad, item.id_proveedor, item.idProducto, item.descripcion], err => {
        if (err) console.error("Error al insertar en salida:", err);
      });
    });
    req.session.carrito_compra = [];
    return res.redirect("/salida");
  }
});

// RUTA DE ELIMINAR DEL CARRITO (MODIFICADA)
app.post('/eliminar-carrito', (req, res) => {
  const index = parseInt(req.body.index); 
  const tipo = req.session.tipo; 

  let carritoActual;
  let redirectPath;

  if (tipo === "venta") {
    carritoActual = req.session.carrito_venta;
    redirectPath = '/confirmacion';
  } else if (tipo === "compra") {
    carritoActual = req.session.carrito_compra;
    redirectPath = '/salidaConfirmacion';
  } else {
   
    console.warn('Tipo de sesión no definido o carrito no identificado para eliminar.');
   
    return res.redirect('/'); 
  }

  // Validaciones
  if (!isNaN(index) && carritoActual && carritoActual.length > index && index >= 0) {
    carritoActual.splice(index, 1); 
    console.log(`Elemento en índice ${index} eliminado del carrito de tipo ${tipo}.`);
  } else {
    console.log(`Fallo al eliminar: índice ${index} no válido o carrito vacío/no encontrado para tipo ${tipo}.`);
  }

  // Redirige a la página correspondiente
  return res.redirect(redirectPath);
});










//login con rol
app.get('/login', (req, res) => {
  res.render('login', { mensaje: null });
});

app.get('/reporte', (req, res) => {
  const modo = req.query.modo;
  let condicion = '';
  let valores = [];

  if (modo === 'unica' && req.query.fecha_unica) {
    condicion = 'WHERE DATE(fecha) = ?';
    valores = [req.query.fecha_unica];
  } else if (modo === 'rango' && req.query.fecha_inicio && req.query.fecha_fin) {
    condicion = 'WHERE DATE(fecha) BETWEEN ? AND ?';
    valores = [req.query.fecha_inicio, req.query.fecha_fin];
  } else {
    return res.render('reporte', { datos: null });
  }

  const consulta = `
    SELECT
      (SELECT IFNULL(SUM(valor), 0) FROM salida ${condicion}) AS total_compras,
      (SELECT IFNULL(SUM(precio), 0) FROM movimiento ${condicion}) AS total_ventas,
      ((SELECT IFNULL(SUM(precio), 0) FROM movimiento ${condicion}) -
       (SELECT IFNULL(SUM(valor), 0) FROM salida ${condicion})) AS ganancia
  `;

  // Se multiplican los valores por 2 porque hay 2 subconsultas que usan la misma condición
  const valoresFinales = modo === 'rango' ? [...valores, ...valores, ...valores, ...valores] : [...valores, ...valores, ...valores, ...valores];

  conexion.query(consulta, valoresFinales, (err, resultado) => {
    if (err) throw err;
    res.render('reporte', { datos: resultado[0] });
  });
});




//pagina principal
//total productos
app.get('/', (req, res) => {
  conexion.query("SELECT COUNT(*) AS total FROM producto", (err, resultadosTotal) => {
    if (err) throw err;
    const total = resultadosTotal[0].total;
    
    
    //cantidad de productos con stock bajo
    conexion.query("SELECT COUNT(*) AS resultado FROM producto WHERE stockActual <= stockMinimo AND stockActual != 0", (err, resultadosTotal2) => {
      if (err) throw err;
      const resultado = resultadosTotal2[0].resultado;

      //cantidd productos agotados
      conexion.query("SELECT COUNT(*) AS resultado2 FROM producto WHERE stockActual = 0", (err, resultadosT) => {
        if (err) throw err;
        const resultado2 = resultadosT[0].resultado2;
 
        //productos proximos a vencer 
        conexion.query(`
          SELECT p.*, pr.nombre AS nombreProveedor, c.nombre AS nombreCategoria
          FROM producto p
          JOIN proveedor pr ON p.idProveedor = pr.idProveedor
          JOIN categoria c ON p.IDcategoria = c.id_categoria
          WHERE fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        `, (err, resultadosProximos) => {
          if (err) throw err;

          resultadosProximos.forEach(p => {
            p.fecha_vencimiento_formateada = new Date(p.fecha_vencimiento).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            });
          });

          
          res.render('index', {
            total: total,
            resultado: resultado,
            resultado2: resultado2,
            producto1: resultadosProximos
          });
        });
      });
    });
  });
});


//stock bajo
app.get('/stock_bajo', (req, res) => {
  conexion.query("SELECT * FROM producto WHERE stockActual <= stockMinimo AND stockActual != 0", (err, resultadosTotal2) => {
    if (err) throw err;

    resultadosTotal2.forEach(p => {
      if (p.fecha_vencimiento) {
        p.fecha_vencimiento_formateada = new Date(p.fecha_vencimiento).toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      } else {
        p.fecha_vencimiento_formateada = 'Sin fecha';
      }
    });

    res.render('stock_bajo', {
      productos: resultadosTotal2
    });
  });
});


//productos agotados
app.get('/productosA', (req, res) => {
  conexion.query("SELECT * FROM producto WHERE stockActual = 0", (err, resultadosT) => {
    if (err) throw err;

    resultadosT.forEach(p => {
        p.fecha_vencimiento_formateada = new Date(p.fecha_vencimiento).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
      
       
    });

    res.render('productosA', {
      resultado2: resultadosT,
    });
    });
  });
});



//servidor local
app.listen(3000, function() {
  console.log("El servidor está en http://localhost:3000");
});
