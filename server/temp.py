import time
import sys
#import Adafruit_DHT
import random

#sensor =  Adafruit_DHT.AM2302
pin = 4

while True: 
  timeBeforeCall = time.time()
  time.sleep(1)
  timeAfterCall = time.time()
  delayInMs = str(int((timeAfterCall - timeBeforeCall) * 1000))
  timestamp = str(timeAfterCall * 1000)
  humidity = str(random.randint(40, 60))
  temperature = str(random.randint(20, 25))
  print('{"delay":' + delayInMs + ',"timestamp":' + timestamp + ', "humidity":' + humidity + ', "temperature":' + temperature + '}')
  sys.stdout.flush()
 
  '''
  humidity, temperature = Adafruit_DHT.read_retry(sensor, pin)

  if humidity is not None and temperature is not None:
    print 'Temp={0:0.1f}*C  Humidity={1:0.1f}%'.format(temperature, humidity)
  else:
    print 'Failed to get reading. Try again!'
  sys.stdout.flush()
  time.sleep(1.5)
'''