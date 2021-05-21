import { ApolloServer, gql } from "apollo-server-micro";
import Cors from "micro-cors";
import axios from "axios";
import admin from "firebase-admin";
import serviceAccount from "./credentials/codeable-300820-819387dfe679.json";

//Initialize firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// This data will be returned by our test endpoint
let movies = [
  {
    id: 1,
    tag: "SWI",
    name: "The phantom menace",
  },
  {
    id: 2,
    tag: "SWII",
    name: "Atack of the clones",
  },
  {
    id: 3,
    tag: "SWIII",
    name: "Revenge of the sith",
  },
  {
    id: 4,
    tag: "SWIV",
    name: "A new hope",
  },
  {
    id: 5,
    tag: "SWV",
    name: "The empire strikes back",
  },
  {
    id: 6,
    tag: "SWVI",
    name: "Return of the jedi",
  },
  {
    id: 7,
    tag: "SWVII",
    name: "The force awakens",
  },
  {
    id: 8,
    tag: "SWVIII",
    name: "The last jedi",
  },
  {
    id: 9,
    tag: "SWIX",
    name: "The rise of skywalker",
  },
];

// Construct a schema using GraphQL schema language
const typeDefs = gql`
  type Movie {
    id: Int
    name: String
    tag: String
  }

  type Homeworld {
    name: String
    terrain: String
  }

  type Person {
    name: String
    birth_year: String
    homeworld: Homeworld
  }

  type Query {
    movie(id: ID): Movie
    movies: [Movie]
    person(id: ID): Person
    favorites: [Movie]
  }

  input NewMovie {
    id: ID
    tag: String
    name: String
  }

  type Mutation {
    addMovie(movie: NewMovie): Movie
    addFavorite(movieId: ID): Boolean
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {
  Person: {
    homeworld: async (person) => {
      const response = await axios.get(person.homeworld);
      const homeworld = response.data;
      return homeworld;
    },
  },
  Query: {
    movie: (_, args) => {
      return movies.find((movie) => movie.id === parseInt(args.id));
    },
    movies: () => {
      return movies;
    },
    person: async (_, args) => {
      const response = await axios.get(
        `https://swapi.dev/api/people/${args.id}`
      );
      const person = response.data;
      return person;
    },
    favorites: async () => {
      const favorites = [];
      const snapshot = await db.collection("favorites").get();
      snapshot.forEach((favorite) =>
        favorites.push(
          movies.find((movie) => movie.id === parseInt(favorite.data().movieId))
        )
      );
      return favorites;
    },
  },
  Mutation: {
    addMovie: (_, args) => {
      const id = movies[movies.length - 1].id + 1;
      const movie = { ...args.movie, id };
      movies = [...movies, movie];
      return movie;
    },
    addFavorite: async (_, args) => {
      const res = await db.collection("favorites").doc().set({
        movieId: args.movieId,
      });
      return !!res;
    },
  },
};

// Add cors
const cors = Cors({
  allowMethods: ["POST", "OPTIONS"],
});

const server = new ApolloServer({ typeDefs, resolvers });

const handler = server.createHandler({
  path: "/api/graphql",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default cors(handler);
