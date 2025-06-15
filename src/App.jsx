import React from "react";
import {useEffect, useState} from "react"
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import {useDebounce} from 'react-use';
import { getTrendingMovies, updateSearchCount } from "./appwrite.js";

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwNTdiZTZiMTRiYTRlNDg4N2FmNjE0OWVjY2U3NTQzYyIsIm5iZiI6MTc0NjAzODU3MC4xMzQsInN1YiI6IjY4MTI2ZjJhODI2N2UxMThiOTU2Nzk5YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.NMRfk0hEdpzwnQTd7Og2C4GX9hroY1jhUEO200SvfcA';
//import.meta.env.VITE_TMDB_API_KEY
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  }
}

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [movieList, setMovieList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debouncedSearchTerm, setDebounceedSearchTerm] = useState('');

  // Debounce the search term to avoid too many API calls
  // useDebounce is a custom hook that delays the execution of a function
  // until after a specified delay (in this case, 500ms) has passed.
  useDebounce(
    () => {
      setDebounceedSearchTerm(searchTerm);
    },
    500,
    [searchTerm]
  )

  const fetchMovies = async (query = '') => {
    setLoading(true);
    setErrorMessage('');
    try{
      const endpoint = query ? `${API_BASE_URL}/search/movie?query=${query}` : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);
      if(!response.ok){
       // throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if(data.response === 'False'){
        setErrorMessage(data.Error || 'Movie Not Found');
        setMovieList([]);
        return;
      }
      setMovieList(data.results || []);
      updateSearchCount();
      if (query && data.results.legnth > 0) {
        // Update the search count in the database
        await updateSearchCount(query, data.results[0]);
      }
    } catch(error){
      console.error(`Error Loading Movies: ${error}`);
      setErrorMessage('Error Loading Movies Try Again Later');
    }
    finally {
      setLoading(false);
    }
  } 

  // Fetch trending movies on initial load
  const loadingTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    }
    catch (error) {
      console.error(`Error Loading Trending Movies: ${error}`);
      setErrorMessage('Error Loading Trending Movies Try Again Later');
    }
    finally {
      setLoading(false);
    };
  }
  

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm] );

  useEffect(() => {
    loadingTrendingMovies();
  }
  , []);


  return (
    <main>
      <div className="pattern" />
        <div className="wrapper">
          <header>
            <img src="./hero.png" alt="Hero Banner" />
            <h1> Create or Watch Immersive <span className="text-gradient">3D Movies</span>, With a Single Prompt</h1>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </header>
          {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.search_term} />
                </li>
              ))}
            </ul>
            </section>)}
          <section className="all-movies">
            <h2>All Movies</h2>
           {loading ? (
             <Spinner />
           ) : errorMessage ? (
             <p className="text-red-500">{errorMessage}</p>
           ) : (
             <ul>
               {movieList.map((movie) => (
                 <li key={movie.id}>
                   <MovieCard key={movie.id} movie={movie} />
                 </li>
               ))}
             </ul>
           )}
          </section>
        </div>
    </main>
  );
}
export default App;
