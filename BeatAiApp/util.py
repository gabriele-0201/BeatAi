import os
import json

def findElement(map, n):
    for i in range(len(map)):
        for j in range(len(map[i])):
            if(map[i][j] == n):
                return i, j
    
    return -1, -1

def createJsonArrayBalls(balls):
    jsonBalls = []
    
    for ball in balls:
        jsonBalls.append(ball.getJson())

    return json.dumps(jsonBalls)

#Setting the IP of the client
def setIdClient():

    config_list_path = os.path.join(os.path.dirname(__file__), 'neatConfigs/clients/')

    files = os.listdir(config_list_path)

    ids = [n[:(len(n) - 4)] for n in files]

    ids.sort()

    idClient = 1 if len(ids) == 0 else (int(ids[-1]) + 1)

    return idClient

#Write in the config file the population and the number of the client
def setPopulation(pop, idClient):
    config_path = os.path.join(os.path.dirname(__file__), 'neatConfigs/config-feedforward.txt')

    with open(config_path, 'r') as f:
        data = f.read()

    data = data.replace('POPULATION_TO_BE_SET', str(pop))
    data = data.replace('CLIENT_ID_TO_BE_SET', str(idClient))

    new_config_path = os.path.join(os.path.dirname(__file__), 'neatConfigs/clients/' + str(idClient) + '.txt')

    print(new_config_path)

    with open(new_config_path, 'w') as f:
        f.write(data)

def delateConfig(idClient):

    config_file = os.path.join(os.path.dirname(__file__), 'neatConfigs/clients/' + str(idClient) + '.txt')

    if os.path.isfile(config_file):
        os.remove(config_file)
    else:
        print(f'Error: {config_file} not a valid filename')
