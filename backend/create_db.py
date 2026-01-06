# import psycopg2
# from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# def create_database():
#     # Connect to the default 'postgres' database to create a new one
#     # Note: trying default credentials. If this fails, user has to do it manually.
#     try:
#         con = psycopg2.connect(
#             dbname='postgres',
#             user='postgres',
#             host='localhost',
#             password='root'
#         )
#         con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
#         cur = con.cursor()
        
#         # Check if exists
#         cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'lyrcon'")
#         exists = cur.fetchone()
        
#         if not exists:
#             cur.execute('CREATE DATABASE lyrcon;')
#             print("Database 'lyrcon' created successfully!")
#         else:
#             print("Database 'lyrcon' already exists.")
            
#         cur.close()
#         con.close()
#     except Exception as e:
#         print(f"Failed to create database automatically: {e}")
#         print("Please create the database 'lyrcon' manually using pgAdmin or psql.")

# if __name__ == "__main__":
#     create_database()
