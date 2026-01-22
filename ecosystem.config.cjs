module.exports = {
    apps: [
        {
            name: 'lyrcon-backend',
            cwd: '/home/ubuntu/lyrcon-replica/backend',
            script: 'venv/bin/python',
            args: 'app.py',
            env: {
                FLASK_ENV: 'production',
                DATABASE_URL: 'postgresql://lyrcon_user:your_secure_password@localhost/LyrconCar'
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
            cwd: '/home/ubuntu/lyrcon-replica',
            script: 'npm',
            args: 'run preview -- --host 0.0.0.0 --port 5173',
            error_file: '/home/ubuntu/logs/frontend-error.log',
            out_file: '/home/ubuntu/logs/frontend-out.log',
            time: true,
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M'
        }
    ]
};
