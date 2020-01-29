from flask import Flask, render_template, jsonify
import psycopg2 as psql

app = Flask(__name__)
db = psql.connect(dbname="geovis",host='127.0.0.1', user='postgres', password='Titi.1802')

@app.route('/') #faire la racine pour la carte
def index():
    return render_template('index_glacier.html') #le render_template affiche le fichier html



@app.route('/liste')
def cabanes():
    c = db.cursor()
    c.execute("""
        SELECT glacier_name, ST_X(geom)::integer, ST_Y(geom)::integer
        FROM glacier_info
    """)
    rows = [{
        'nom': l[0], 'x': l[1], 'y': l[2]
    } for l in c]
    c.close()
    return render_template('index_glacier.html',
        glacier=rows
    )
#séLectionne toutes les cabanes

@app.route('/glaciers_info.json')
def coordonnees_glacier():
    c = db.cursor()
    c.execute("""
        SELECT glacier_name, glacier_id,ST_x(ST_Transform(geom,4326)),ST_y(ST_Transform(geom,4326))
        FROM glacier_info
    """)
    rows = [{
        'nom': l[0], 'id': l[1], 'x': l[2], 'y': l[3]
    } for l in c]
    c.close()
    return jsonify(rows)

    @app.route('/name.json')
    def coordonnees_glacier():
        c = db.cursor()
        c.execute("""
            SELECT glacier_name,ST_x(ST_Transform(geom,4326)),ST_y(ST_Transform(geom,4326))
            FROM glacier_info
        """)
        rows = [{
            'nom': l[0].replace("/", " "), 'x': l[2], 'y': l[3]
        } for l in c]
        c.close()
        return jsonify(rows)

@app.route('/data.json')
def cabanes_json():
    c = db.cursor()
    c.execute("""
         SELECT glacier_name, glacier_id, glacier_area, ST_x(geom) ,ST_y(geom), st_date_len_change, end_date_len_change, length_change, st_date_vol_change, end_date_vol_change, volume_change
         FROM glacier_info, len_change, vol_change
         WHERE len_change.len_change_id = glacier_info.glacier_id
         AND vol_change.vol_change_id = glacier_info.glacier_id
    """)
    rows = [{
        'nom': l[0], 'id': l[1], 'area': l[2], 'x': l[3], 'y': l[4], 'start_date_length': l[5], 'end_date_length': l[6],
        'longueur': l[7], 'start_date_vol': l[8], 'end_date_vol': l[9], 'volume': l[10]
    } for l in c]
    c.close()
    return jsonify(rows)

#route pour la longueur
@app.route('/length/<glacier>.json')
def length_json(glacier):
    """
    Un id de glacier a le format suivant: A10g/05
    Ceci n'est pas compatible avec les URLs. Dans l'URL, l'id sera A10g-05.
    """
    id_glacier = glacier.replace('-', '/')
    c = db.cursor()
    c.execute("""
         SELECT st_date_len_change, end_date_len_change, length_change,
            SPLIT_PART(st_date_len_change, '.', 3) as y,
            SPLIT_PART(st_date_len_change, '.', 2) as m,
            SPLIT_PART(st_date_len_change, '.', 1) as d
         FROM len_change
         WHERE len_change_id = %s
         ORDER BY y, m, d
        """, (id_glacier, ))
    out = {
        'id_glacier': id_glacier,
        'lengths': [{'date':format_date(l[0]),'length': float(l[2].replace(',', '.'))} for l in c]#on remplace la virgule par des points pour les longueurs
    }
    c.close()
    return jsonify(out)

def format_date(dt): #transformation du format des dates
    d = dt.split('.')
    return '%s-%02i-%02i' % (d[2], int(d[1]), int(d[0]))



#route pour le masse BALANCE
@app.route('/mass_balance/<glacier>.json')
def mass_balance_json(glacier):
    id_glacier = glacier.replace('-','/')
    c = db.cursor()
    c.execute("""
        SELECT st_date, end_date, annual_mb,
            SPLIT_PART (st_date, '.', 3) as y,
            SPLIT_PART (st_date, '.', 2) as m,
            SPLIT_PART (st_date, '.', 1) as d
        FROM mass_balance
        WHERE mass_balance_id = %s
        ORDER BY y, m, d
    """, (id_glacier, ))
    def format_date (dt):
        d= dt.split('.')
        return '%s-%02i-%02i' % (d[2], int(d[1]), int(d[0]))
    out = {
        'id_glacier' : id_glacier,
        'mass_balances': [{'date': format_date(l[0]),'mass_balance':int(l[2])} for l in c]
    }
    c.close()
    return jsonify(out)




#route pour le equilibrium line
@app.route('/ela/<glacier>.json')
def ela_json(glacier):
    id_glacier = glacier.replace('-', '/')
    c = db.cursor()
    c.execute("""
        SELECT st_date, end_date, ela,
            SPLIT_PART (st_date, '.', 3) as y,
            SPLIT_PART (st_date, '.', 2) as m,
            SPLIT_PART (st_date, '.', 1) as d
        FROM mass_balance
        WHERE mass_balance_id = %s
        ORDER BY y, m, d
    """, (id_glacier, ))
    def format_date (dt):
        d= dt.split('.')
        return '%s-%02i-%02i' % (d[2], int(d[1]), int(d[0]))
    out = {
        'id_glacier' : id_glacier,
        'elas': [{'date': format_date(l[0]),'ela':int(l[2])} for l in c]
    }
    c.close()
    return jsonify(out)


#winter mass balance
@app.route('/winter_mass_balance/<glacier>.json')
def winter_mass_balance_json(glacier):
    id_glacier = glacier.replace('-','/')
    c = db.cursor()
    c.execute("""
        SELECT st_date, end_date, winter_mb,
            SPLIT_PART (st_date, '.', 3) as y,
            SPLIT_PART (st_date, '.', 2) as m,
            SPLIT_PART (st_date, '.', 1) as d
        FROM mass_balance
        WHERE mass_balance_id = %s
        ORDER BY y, m, d
    """, (id_glacier, ))
    def format_date (dt):
        d= dt.split('.')
        return '%s-%02i-%02i' % (d[2], int(d[1]), int(d[0]))
    out = {
        'id_glacier' : id_glacier,
        'winter_mass_balances': [{'date': format_date(l[0]),'winter_mass_balance':int(l[2])} for l in c]
    }
    c.close()
    return jsonify(out)


#ROUTE POUR LE SUMMER MASS BALANCE
@app.route('/summer_mass_balance/<glacier>.json')
def summer_mass_balance_json(glacier):
    id_glacier = glacier.replace('-', '/')
    c = db.cursor()
    c.execute("""
        SELECT st_date, end_date, summer_mb,
            SPLIT_PART (st_date, '.', 3) as y,
            SPLIT_PART (st_date, '.', 2) as m,
            SPLIT_PART (st_date, '.', 1) as d
        FROM mass_balance
        WHERE mass_balance_id = %s
        ORDER BY y, m
        , d
    """, (id_glacier, ))
    def format_date (dt):
        d= dt.split('.')
        return '%s-%02i-%02i' % (d[2], int(d[1]), int(d[0]))
    out = {
        'id_glacier' : id_glacier,
        'summer_mass_balances': [{'date': format_date(l[0]),'summer_mass_balance':int(l[2])} for l in c]
    }
    c.close()
    return jsonify(out)

#ne retrouve pas l'html mais la base de données.
if __name__ == '__main__':
    app.run(debug=True)
