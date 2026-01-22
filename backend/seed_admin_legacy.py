import psycopg2
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")

def seed_admin():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Check if admin exists
        cur.execute("SELECT id FROM users WHERE email = 'admin@lyrcon.com'")
        if cur.fetchone():
            print("Admin user already exists.")
        else:
            # Legacy Schema: full_name, email, password, role
            cur.execute("""
                INSERT INTO users (full_name, email, password, role, status)
                VALUES (%s, %s, %s, %s, %s)
            """, ('Admin User', 'admin@lyrcon.com', 'password123', 'admin', 'active'))
            conn.commit()
            print("Admin user seeded successfully.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error seeding admin: {e}")

if __name__ == "__main__":
    seed_admin()
