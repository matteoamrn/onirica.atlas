from flask import Flask, request, jsonify
import numpy as np
from sklearn.preprocessing import StandardScaler
from sentence_transformers import SentenceTransformer
from umap.parametric_umap import load_ParametricUMAP
from flask_cors import CORS

class UMAPProjector:
    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)
        self.app.route('/project/<input_string>', methods=['GET'])(self.project_umap)
        self.app.route('/')(self.homepage)

        self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        print("loaded bert transfomer")
        self.scaler = StandardScaler()
        self.scaler.mean_ = np.load("data/scaler_mean.npy")
        self.scaler.scale_ = np.load("data/scaler_scale.npy")
        print("loaded scaler")
        self.reducer = load_ParametricUMAP('parametricv2')       
        print("loaded parametric umap")    

    def run(self):
        self.app.run(debug=True)

    def homepage(self):
        return "<h1 style='color: red;'>FLASK SERVER !</h1>"

    def project_umap(self, input_string):

        embedding = self.scaler.transform(self.model.encode(input_string).reshape(1, -1))
        point = self.reducer.transform(embedding)[0]
        result = {
            'x': str(point[0]),
            'y': str(point[1]),
            'z': str(point[2])
        }
        return jsonify(result)

    
if __name__ == '__main__':
    projector = UMAPProjector()
    projector.run()