// 1- llamado a Express
const express = require('express');
const app = express();

// 2-
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 3- llamado a env
const dotenv = require('dotenv');
dotenv.config({ path: './env/.env' });

// 4- llamado a archivos estaticos y css en la carpeta public
app.use('/resources', express.static('public'));
app.use('resources', express.static(__dirname + '/public'));

// 5-Motor de plantillas.
app.set('view engine', 'ejs');

//6- encriptacion de contraseñas
const bcrypt = require('bcryptjs');

//7- variables de session
const session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
}));

// 8-Llamado al modulo de conexion de la BD
const connection = require('./database/db')

// 9-Establecemos las Rutas
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

// 10-Metodo para a la Registracion
app.post('/register', async (req, res) => {
    const user = req.body.user;
    const mail = req.body.mail;
    const pass = req.body.pass;

    let passwordHash = await bcrypt.hash(pass, 8);
    connection.query('INSERT INTO usuario SET ?', { user: user, mail: mail, pass: passwordHash }, async (error, results) => {
        if (error) {
            console.log(error);
        } else {
            res.render('register', {
				alert: true,
				alertTitle: "Registracion",
				alertMessage: "¡Se ha registrado con exito!",
				alertIcon:'success',
				showConfirmButton: false,
				timer: 1500,
				ruta: ''
            })
        }
    })
})

//11- Metodo para la Autenticacion
app.post('/auth', async (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHash = await bcrypt.hash(pass, 8);
    if (user && pass) {
        connection.query('SELECT * FROM usuario WHERE user = ?', [user], async (error, results, fields) => {
            if (results.length == 0 || !(await bcrypt.compare(pass, results[0].pass))) {
                res.render
                    ('login', {
                        alert: true,
                        alertTitle: "Error",
                        alertMessage: "Usuario y/o contraseña incorrectas",
                        alertIcon: 'error',
                        showConfirmButton: true,
                        timer: false,
                        ruta: 'login'
                    });
            } else {
                req.session.loggedin = true;
                req.session.name = results[0].name
                res.render
                    ('login', {
                        alert: true,
                        alertTitle: "Conexion Exitosa",
                        alertMessage: "¡Login correcto!",
                        alertIcon: 'succes',
                        showConfirmButton: true,
                        timer: 1500,
                        ruta: ''
                    });
            }
            res.end();
        });
    } else {
        res.send('por favor ingrese un usuario y/o password');
        res.end();
    }

})
// 12- metodo para controlar que esta auth en todas las paginas
app.get('/', (req, res) => {
    if (req.session.loggedin) {
        res.render('index', {
            login: true,
            name: req.session.name
        });
    } else {
        res.render('index', {
            login: false,
            name: 'Debe iniciar sesion'
        });
    }
    res.end();
});

// funcion para limpiar cache para luego del logout
app.use(function (req, res, next) {
    if (!req.user)
        res.header('cache-control', 'private, no-cache, no store, must-revalidate');
    next();
});

// logout
// destruye la sesion
app.get('/logout', function (req, res) {
    req.session.destroy(() => {
        res.redirect('/') //siempre se ejecutara despues de que se destruya la sesion
    })
});
app.listen(3000, (req, res) => {
    console.log(' SERVER LISTO EN http://localhost:3000');
})