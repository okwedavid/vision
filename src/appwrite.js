const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID ;
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID ;       
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID ;
import { Client, Databases, ID, Query } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID);

const databases = new Databases(client);

export const updateSearchCount = async (searchTearm, movie) =>{
   //1. use the Appwrite SDK to update the search count in the database
   try {
    const results = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('search_term', searchTearm)]
    );
    // 2. If the search term exists, update the count
    if (results.length > 0) {
        const doc = results.documents[0];
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID,
            doc.$Id,
            { count: doc.count + 1 }
        );
    //3. If the search term does not exist, create a new document
    } else {
        await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID,
            ID.unique(),
            {
                searchTearm,
                count: 1,
                movie_id: movie.id,
                poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
            }
        );
    }
} catch (error) {
    console.error('Error updating search count:', error);
    }
}
export const getTrendingMovies = async () => {
  try {
    const results = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.limit(5),
        Query.orderDesc('count')], 5
       // Limit to top 10 trending movies
    );

    return results.documents;
  }
  catch (error) {
    console.error('Error fetching trending movies:', error);
    return [];
  }
}