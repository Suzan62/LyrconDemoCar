module.exports = {
    apps: [
        {
            name: 'lyrcon-backend',
            cwd: '/home/ubuntu/LyrconDemoCar/backend',
            script: '/home/ubuntu/LyrconDemoCar/backend/venv/bin/python',  // Fixed: venv is inside backend folder
            args: 'app.py',
            interpreter: 'none',  // Added: Important for using Python directly
            env: {
                FLASK_ENV: 'production',
                FLASK_APP: 'app.py',  // Added: Good practice
                PYTHONUNBUFFERED: '1',  // Added: See logs in real-time
                DATABASE_URL: 'postgresql://lyrcon_user:Lyrcon2024@localhost/lyrconcar'
            },
            error_file: '/home/ubuntu/logs/backend-error.log',
            out_file: '/home/ubuntu/logs/backend-out.log',
            time: true,
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G'
        },
        {
            name: 'lyrcon-frontend',
            cwd: '/home/ubuntu/LyrconDemoCar',
            script: 'npm',
            args: 'run preview -- --host 0.0.0.0 --port 5173',
            error_file: '/home/ubuntu/logs/frontend-error.log',
            out_file: '/home/ubuntu/logs/frontend-out.log',
            time: true,
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '500M'
        }
    ]
};