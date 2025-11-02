// src/seed.js
import mongoose from 'mongoose';
import connectdb from './db.js';
import Movie from './Movie.js';

const movies = [
  {
    id: 1,
    title: "Inception",
    plot: "Un ladrón que roba secretos corporativos a través del uso de la tecnología de compartir sueños recibe la tarea inversa de plantar una idea en la mente de un CEO.",
    year: 2010,
    genre: "Ciencia Ficción",
    director: "Christopher Nolan"
  },
  {
    id: 2,
    title: "The Shawshank Redemption",
    plot: "Dos hombres encarcelados se unen a lo largo de varios años, encontrando consuelo y eventual redención a través de actos de decencia común.",
    year: 1994,
    genre: "Drama",
    director: "Frank Darabont"
  },
  {
    id: 3,
    title: "The Dark Knight",
    plot: "Cuando la amenaza conocida como el Joker causa estragos y caos en la gente de Gotham, Batman debe aceptar una de las mayores pruebas psicológicas y físicas.",
    year: 2008,
    genre: "Acción",
    director: "Christopher Nolan"
  },
  {
    id: 4,
    title: "Pulp Fiction",
    plot: "Las vidas de dos sicarios de la mafia, un boxeador, la esposa de un gángster y dos bandidos se entrelazan en cuatro historias de violencia y redención.",
    year: 1994,
    genre: "Crimen",
    director: "Quentin Tarantino"
  },
  {
    id: 5,
    title: "Forrest Gump",
    plot: "Las presidencias de Kennedy y Johnson, la guerra de Vietnam y Watergate se desarrollan desde la perspectiva de un hombre de Alabama con un coeficiente intelectual de 75.",
    year: 1994,
    genre: "Drama",
    director: "Robert Zemeckis"
  },
  {
    id: 6,
    title: "The Matrix",
    plot: "Un hacker descubre que la realidad es una simulación creada por máquinas y se une a una rebelión para liberar a la humanidad.",
    year: 1999,
    genre: "Ciencia Ficción",
    director: "The Wachowskis"
  },
  {
    id: 7,
    title: "Interstellar",
    plot: "Un equipo de exploradores viaja a través de un agujero de gusano en el espacio en un intento de asegurar la supervivencia de la humanidad.",
    year: 2014,
    genre: "Ciencia Ficción",
    director: "Christopher Nolan"
  },
  {
    id: 8,
    title: "The Godfather",
    plot: "El patriarca envejecido de una dinastía del crimen organizado transfiere el control de su imperio clandestino a su reticente hijo.",
    year: 1972,
    genre: "Crimen",
    director: "Francis Ford Coppola"
  },
  {
    id: 9,
    title: "Parasite",
    plot: "Codicia y discriminación de clases amenazan la relación simbiótica recién formada entre la acaudalada familia Park y el clan desfavorecido Kim.",
    year: 2019,
    genre: "Drama",
    director: "Bong Joon-ho"
  },
  {
    id: 10,
    title: "Fight Club",
    plot: "Un oficinista insomne forma un club de lucha clandestino que evoluciona en algo mucho más.",
    year: 1999,
    genre: "Drama",
    director: "David Fincher"
  },
  {
    "id": 11,
    "title": "Gladiator",
    "plot": "Un ex general romano busca venganza contra el corrupto emperador que asesinó a su familia y lo envió al exilio como esclavo.",
    "year": 2000,
    "genre": "Acción",
    "director": "Ridley Scott"
  },
  {
    "id": 12,
    "title": "Titanic",
    "plot": "Una joven de la alta sociedad se enamora de un artista humilde a bordo del Titanic durante su trágico viaje inaugural.",
    "year": 1997,
    "genre": "Romance",
    "director": "James Cameron"
  },
  {
    "id": 13,
    "title": "Saving Private Ryan",
    "plot": "Durante la Segunda Guerra Mundial, un grupo de soldados es enviado detrás de las líneas enemigas para rescatar a un paracaidista cuyo hermano ha muerto en combate.",
    "year": 1998,
    "genre": "Bélico",
    "director": "Steven Spielberg"
  },
  {
    "id": 14,
    "title": "The Lord of the Rings: The Fellowship of the Ring",
    "plot": "Un hobbit emprende una peligrosa misión para destruir un anillo que podría darle poder absoluto al Señor Oscuro Sauron.",
    "year": 2001,
    "genre": "Fantasía",
    "director": "Peter Jackson"
  },
  {
    "id": 15,
    "title": "The Silence of the Lambs",
    "plot": "Una joven agente del FBI busca la ayuda de un asesino en serie encarcelado para capturar a otro asesino que despelleja a sus víctimas.",
    "year": 1991,
    "genre": "Thriller",
    "director": "Jonathan Demme"
  },
  {
    "id": 16,
    "title": "Schindler's List",
    "plot": "Durante la Segunda Guerra Mundial, un empresario alemán salva a más de mil judíos polacos al emplearlos en sus fábricas.",
    "year": 1993,
    "genre": "Drama",
    "director": "Steven Spielberg"
  },
  {
    "id": 17,
    "title": "Se7en",
    "plot": "Dos detectives cazan a un asesino en serie que usa los siete pecados capitales como motivo para sus asesinatos.",
    "year": 1995,
    "genre": "Crimen",
    "director": "David Fincher"
  },
  {
    "id": 18,
    "title": "The Green Mile",
    "plot": "La vida de los guardias del corredor de la muerte cambia cuando uno de los prisioneros muestra un misterioso poder de curación.",
    "year": 1999,
    "genre": "Drama",
    "director": "Frank Darabont"
  },
  {
    "id": 19,
    "title": "Goodfellas",
    "plot": "La historia real de Henry Hill y su vida en la mafia, cubriendo su relación con su esposa Karen y sus socios Jimmy y Tommy.",
    "year": 1990,
    "genre": "Crimen",
    "director": "Martin Scorsese"
  },
  {
    "id": 20,
    "title": "The Prestige",
    "plot": "Dos magos rivales en el Londres victoriano se enzarzan en una obsesiva competencia para crear el mejor truco de ilusión.",
    "year": 2006,
    "genre": "Drama",
    "director": "Christopher Nolan"
  },
  {
    "id": 21,
    "title": "Avatar",
    "plot": "Un ex marine parapléjico es enviado a Pandora, donde se debate entre seguir órdenes humanas o proteger el mundo de los Na'vi.",
    "year": 2009,
    "genre": "Ciencia Ficción",
    "director": "James Cameron"
  },
  {
    "id": 22,
    "title": "Whiplash",
    "plot": "Un joven baterista busca la grandeza bajo la guía de un instructor despiadado en un conservatorio de música de élite.",
    "year": 2014,
    "genre": "Drama",
    "director": "Damien Chazelle"
  },
  {
    "id": 23,
    "title": "The Social Network",
    "plot": "La historia de cómo Mark Zuckerberg creó Facebook y los conflictos personales y legales que siguieron.",
    "year": 2010,
    "genre": "Drama",
    "director": "David Fincher"
  },
  {
    "id": 24,
    "title": "Joker",
    "plot": "Un comediante fracasado con problemas mentales se transforma en el infame criminal conocido como el Joker.",
    "year": 2019,
    "genre": "Drama",
    "director": "Todd Phillips"
  },
  {
    "id": 25,
    "title": "Blade Runner 2049",
    "plot": "Un nuevo blade runner descubre un secreto enterrado durante mucho tiempo que lo lleva a buscar al desaparecido Rick Deckard.",
    "year": 2017,
    "genre": "Ciencia Ficción",
    "director": "Denis Villeneuve"
  },
  {
    "id": 26,
    "title": "The Revenant",
    "plot": "Después de ser atacado por un oso y dado por muerto, un explorador lucha por sobrevivir y vengarse de quien lo traicionó.",
    "year": 2015,
    "genre": "Aventura",
    "director": "Alejandro González Iñárritu"
  },
  {
    "id": 27,
    "title": "La La Land",
    "plot": "Una actriz en ciernes y un músico de jazz se enamoran mientras persiguen sus sueños en Los Ángeles.",
    "year": 2016,
    "genre": "Romance",
    "director": "Damien Chazelle"
  },
  {
    "id": 28,
    "title": "Django Unchained",
    "plot": "Un esclavo liberado se une a un cazarrecompensas alemán para rescatar a su esposa de un despiadado propietario de plantación.",
    "year": 2012,
    "genre": "Western",
    "director": "Quentin Tarantino"
  },
  {
    "id": 29,
    "title": "The Wolf of Wall Street",
    "plot": "La historia real de Jordan Belfort, un corredor de bolsa neoyorquino cuya codicia y excesos lo llevaron a la ruina.",
    "year": 2013,
    "genre": "Biografía",
    "director": "Martin Scorsese"
  },
  {
    "id": 30,
    "title": "12 Angry Men",
    "plot": "Doce miembros de un jurado deliberan sobre la culpabilidad de un acusado adolescente, mientras uno de ellos siembra dudas razonables.",
    "year": 1957,
    "genre": "Drama",
    "director": "Sidney Lumet"
  },
{
  "id": 31,
  "title": "Rain Man",
  "plot": "Un egoísta vendedor descubre que tiene un hermano mayor con autismo y habilidades extraordinarias, y ambos emprenden un viaje que cambiará sus vidas.",
  "year": 1988,
  "genre": "Drama",
  "director": "Barry Levinson"
}
];

async function seed() {
  try {
    // Wait for connection
    await connectdb();

    await Movie.deleteMany({});
    await Movie.insertMany(movies);

    console.log('🎬 Movie database seeded!');
  } catch (err) {
    console.error('❌ Error seeding:', err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
